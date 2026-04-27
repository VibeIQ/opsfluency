-- OpsFluency — employees extended profile + QR-claim invite flow.
--
-- 1. `employees` — extended profile for employee-role company members.
--    Stores phone (E.164), preferred language, and last-active timestamp.
--    Linked to company_members via (company_id, clerk_user_id).
--
-- 2. `employee_invites` — manager-seeded invite records keyed by phone number.
--    The phone number is the lookup key during the QR claim flow. Once
--    claimed, the row is tombstoned (claimed_at set) and kept for audit.
--    UNIQUE(company_id, phone) prevents double-inviting the same number.

begin;

-- ── 1. employees ─────────────────────────────────────────────────────────────

create table employees (
  id                 uuid        primary key default gen_random_uuid(),
  company_id         uuid        not null references companies(id) on delete cascade,
  clerk_user_id      text        not null,
  phone              text,
  preferred_language text        not null default 'en'
                                 check (preferred_language in ('en', 'es')),
  last_active_at     timestamptz,
  created_at         timestamptz not null default now(),
  unique (company_id, clerk_user_id)
);

create index employees_company_id_idx    on employees (company_id);
create index employees_clerk_user_id_idx on employees (clerk_user_id);

alter table employees enable row level security;

create policy employees_company_isolation on employees
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

-- ── 2. employee_invites ───────────────────────────────────────────────────────

create table employee_invites (
  id                       uuid        primary key default gen_random_uuid(),
  company_id               uuid        not null references companies(id) on delete cascade,
  phone                    text        not null,
  name                     text,
  email                    text,
  department_ids           uuid[]      not null default '{}',
  invited_by               text        not null,  -- clerk_user_id of manager
  invited_at               timestamptz not null default now(),
  claimed_at               timestamptz,
  claimed_by_clerk_user_id text,
  unique (company_id, phone)
);

-- Partial index on unclaimed invites — the hot path for the claim lookup.
create index employee_invites_company_phone_unclaimed_idx
  on employee_invites (company_id, phone)
  where claimed_at is null;

alter table employee_invites enable row level security;

create policy employee_invites_company_isolation on employee_invites
  for all to authenticated
  using      (company_id = requesting_company_id() or is_super_admin())
  with check (company_id = requesting_company_id() or is_super_admin());

commit;
