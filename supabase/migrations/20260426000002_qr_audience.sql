-- OpsFluency — QR audience targeting + access requests.
--
-- Each QR can now be scoped to a subset of the company's workforce. The two
-- arrays below are interpreted as a UNION at scan time:
--   - audience_department_ids: empty = no department restriction
--   - audience_roles:          empty = no role restriction
--   - both empty               = open to every member of the company
-- A user passes the gate if EITHER array matches their context (or both are
-- empty). Admins and super admins always pass — enforced in app code, not in
-- the array logic.
--
-- qr_access_requests captures the deny-flow "Request access" button. One row
-- per click; managers will surface them in a future inbox view.

begin;

-- ── 1. Audience columns on qr_codes ──────────────────────────────────────────

alter table qr_codes
  add column if not exists audience_department_ids uuid[] not null default '{}',
  add column if not exists audience_roles          text[] not null default '{}';

-- Constrain audience_roles to the three legal role values. Array check works
-- per-element via the <@ ANY-array containment shorthand.
alter table qr_codes
  drop constraint if exists qr_codes_audience_roles_check;
alter table qr_codes
  add constraint qr_codes_audience_roles_check
    check (audience_roles <@ array['admin','manager','employee']::text[]);

-- GIN indexes so the && (overlap) operator used by the scan-time gate hits an
-- index instead of scanning every row.
create index if not exists qr_codes_audience_dept_ids_idx
  on qr_codes using gin (audience_department_ids);
create index if not exists qr_codes_audience_roles_idx
  on qr_codes using gin (audience_roles);

-- ── 2. qr_access_requests ────────────────────────────────────────────────────

create table qr_access_requests (
  id              uuid        primary key default gen_random_uuid(),
  qr_code_id      uuid        not null references qr_codes(id) on delete cascade,
  -- company_id denormalized for RLS — same pattern as qr_scans.
  company_id      uuid        not null references companies(id) on delete cascade,
  -- requested_by is nullable: the deny page sometimes renders before Clerk
  -- propagation has finished. We still log the request so a manager sees the
  -- volume even if they can't reply directly.
  requested_by    text,        -- clerk_user_id
  note            text,        -- optional free text from the requester
  resolved_at     timestamptz,
  resolved_by     text,        -- clerk_user_id of the manager who acted
  created_at      timestamptz not null default now()
);

create index qr_access_requests_qr_code_id_idx on qr_access_requests (qr_code_id, created_at desc);
create index qr_access_requests_company_id_idx on qr_access_requests (company_id, created_at desc)
  where resolved_at is null;

alter table qr_access_requests enable row level security;

create policy qr_access_requests_company_isolation on qr_access_requests
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;
