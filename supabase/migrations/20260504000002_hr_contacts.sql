-- Replaces the initial hr_contacts migration with a richer schema.
-- Also adds contact_phone to company_members so department managers
-- can expose a phone number that workers can tap.
--
-- Changes:
--   1. company_members gets contact_phone (nullable, shown when role = manager).
--   2. hr_contacts gets category + is_primary — HR contacts are institutional
--      (Benefits, Payroll, General) rather than person-linked. Surfaced in
--      the HR department's members tab and rendered in onboarding-template SOPs.

begin;

-- ── 1. Manager contact phone on company_members ───────────────────────────

alter table company_members
  add column if not exists contact_phone text;

comment on column company_members.contact_phone is
  'Phone number exposed to workers when the member role is manager.';

-- ── 2. hr_contacts table ──────────────────────────────────────────────────

create table hr_contacts (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references companies(id) on delete cascade,
  name         text        not null check (char_length(name) between 1 and 100),
  title        text        not null check (char_length(title) between 1 and 100),
  category     text        not null default 'General Questions'
                           check (char_length(category) between 1 and 80),
  email        text,
  phone        text,
  is_primary   boolean     not null default false,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index hr_contacts_company_id_idx on hr_contacts (company_id, sort_order);

comment on table hr_contacts is
  'Institutional HR contacts (Benefits, Payroll, General Questions …).
   Shown in the HR department members tab and as cards at the bottom of
   onboarding-template SOPs. Not tied to company_members rows.';

-- ── 3. updated_at trigger ─────────────────────────────────────────────────

create trigger hr_contacts_updated_at
  before update on hr_contacts
  for each row execute function set_updated_at();

-- ── 4. RLS ────────────────────────────────────────────────────────────────

alter table hr_contacts enable row level security;

create policy hr_contacts_select on hr_contacts
  for select to authenticated
  using (company_id = requesting_company_id() or is_super_admin());

create policy hr_contacts_insert on hr_contacts
  for insert to authenticated
  with check (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  );

create policy hr_contacts_update on hr_contacts
  for update to authenticated
  using (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  )
  with check (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  );

create policy hr_contacts_delete on hr_contacts
  for delete to authenticated
  using (
    company_id = requesting_company_id()
    and (requesting_role() in ('admin', 'manager') or is_super_admin())
  );

commit;
