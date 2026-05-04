import { clerkClient } from "@clerk/nextjs/server";
import { UsersRound } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { DEPT_ICONS } from "@/app/dashboard/departments/_lib/constants";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";
import { DepartmentRosterClient, type RosterMember } from "@/app/dashboard/departments/_components/department-roster-client";
import { HrContactsClient, type HrContactRow } from "@/app/dashboard/departments/_components/hr-contacts-client";

interface Props {
  selectedDeptId?: string;
}

interface DeptRow {
  id: string;
  name: string;
  color_hex: string;
  icon_key: string;
  is_system: boolean;
}

interface MemberRow {
  id: string;
  clerk_user_id: string;
  role: string;
  contact_phone: string | null;
}

async function loadDepts(supabase: SupabaseClient, company_id: string): Promise<DeptRow[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, color_hex, icon_key, is_system")
    .eq("company_id", company_id)
    .order("sort_order", { ascending: true })
    .order("name",       { ascending: true });
  if (error) throw error;
  return (data ?? []) as DeptRow[];
}

async function loadMembersPanel(
  supabase: SupabaseClient,
  company_id: string,
  department_id: string,
): Promise<{ assigned: RosterMember[]; unassigned: RosterMember[] }> {
  const [{ data: allMembers }, { data: memberships }] = await Promise.all([
    supabase
      .from("company_members")
      .select("id, clerk_user_id, role, contact_phone")
      .eq("company_id", company_id)
      .order("role", { ascending: true }),
    supabase
      .from("employee_departments")
      .select("member_id")
      .eq("department_id", department_id)
      .eq("company_id", company_id),
  ]);

  const assignedIds = new Set((memberships ?? []).map((m) => m.member_id));
  const rows: MemberRow[] = (allMembers ?? []) as MemberRow[];

  const clerk = await clerkClient();
  const enriched = await Promise.all(
    rows.map(async (m): Promise<RosterMember> => {
      try {
        const user = await clerk.users.getUser(m.clerk_user_id);
        const email = user.emailAddresses[0]?.emailAddress ?? m.clerk_user_id;
        const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
        const imageUrl = user.imageUrl ?? null;
        return { ...m, email, displayName, imageUrl };
      } catch {
        return { ...m, email: m.clerk_user_id, displayName: null, imageUrl: null };
      }
    }),
  );

  return {
    assigned:   enriched.filter((m) => assignedIds.has(m.id)),
    unassigned: enriched.filter((m) => !assignedIds.has(m.id)),
  };
}

async function loadHrContacts(supabase: SupabaseClient, company_id: string): Promise<HrContactRow[]> {
  try {
    const { data } = await supabase
      .from("hr_contacts")
      .select("id, name, title, category, email, phone, is_primary, sort_order")
      .eq("company_id", company_id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    return (data ?? []) as HrContactRow[];
  } catch {
    // Migration not yet applied — return empty list gracefully.
    return [];
  }
}

export async function MembersTab({ selectedDeptId }: Props) {
  const { supabase, company_id } = await getCompanyContext("manager");
  const depts = await loadDepts(supabase, company_id);

  const selectedDept =
    (selectedDeptId ? depts.find((d) => d.id === selectedDeptId) : null) ??
    depts[0] ??
    null;

  const isHrDept = selectedDept?.is_system && selectedDept?.name === "HR";

  const [panel, hrContacts] = await Promise.all([
    selectedDept ? loadMembersPanel(supabase, company_id, selectedDept.id) : null,
    isHrDept ? loadHrContacts(supabase, company_id) : Promise.resolve([]),
  ]);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* ── Left: department selector ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs self-start">
        <div className="border-b border-[color:var(--dc-edge)] px-4 py-3">
          <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">Departments</p>
        </div>

        {!depts.length ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-dc-text-2">No departments yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--dc-edge)]">
            {depts.map((dept) => {
              const iconKey = dept.icon_key in DEPT_ICONS ? dept.icon_key : "building-2";
              const { Icon } = DEPT_ICONS[iconKey];
              const isActive = dept.id === selectedDept?.id;

              return (
                <li key={dept.id}>
                  <a
                    href={`/dashboard/departments?tab=members&dept=${dept.id}`}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-dc-overlay ${
                      isActive ? "bg-dc-overlay text-dc-text" : "text-dc-text-2"
                    }`}
                  >
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: dept.color_hex }}
                    >
                      <Icon className="size-3.5 text-white" strokeWidth={2} />
                    </div>
                    <span className="truncate">{dept.name}</span>
                    {dept.name === "HR" && dept.is_system && (
                      <span className="ml-auto shrink-0 rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
                        HR
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Right: roster ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {!selectedDept ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-16 text-center">
            <UsersRound className="size-8 text-dc-text-3 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-dc-text-2">Select a department to manage its members</p>
            <p className="mt-1 text-xs text-dc-text-3">Click any department on the left.</p>
          </div>
        ) : (
          <>
            <div>
              <Heading level={2} className="text-xl">{selectedDept.name}</Heading>
              <Text className="mt-1 text-sm">
                {panel!.assigned.length} member{panel!.assigned.length !== 1 ? "s" : ""} assigned
                {isHrDept && " · Managers' contact info appears to workers when they tap a phone number"}
              </Text>
            </div>

            <DepartmentRosterClient
              departmentId={selectedDept.id}
              initial={panel!.assigned}
              unassigned={panel!.unassigned}
            />

            {/* HR-only: institutional contact directory */}
            {isHrDept && (
              <HrContactsClient initial={hrContacts} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
