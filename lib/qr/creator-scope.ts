import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '@/lib/auth/company-context';
import type { CreatorScope } from './audience';

/**
 * Resolves what a manager is allowed to target when creating a QR.
 *
 *   - admin / impersonating super-admin → unrestricted
 *   - manager whose departments include "HR" → unrestricted (HR has org-wide
 *     audience reach by product rule)
 *   - any other manager → only their own department(s); roles limited to
 *     manager + employee (so a department lead can't target admins)
 *
 * Department membership is read via `employee_departments` joined to the
 * caller's `company_members` row. RLS gives us the right tenant slice for free.
 */
export async function getCreatorScope(args: {
  supabase: SupabaseClient;
  userId: string;
  company_id: string;
  role: Role;
  impersonating?: boolean;
}): Promise<CreatorScope> {
  const { supabase, userId, company_id, role, impersonating } = args;

  if (role === 'admin' || impersonating) {
    return { unrestricted: true, allowed_department_ids: [], allowed_roles: [] };
  }

  // Look up the member row for this Clerk user, then their department ids
  // and the names of those departments (we need the name to detect HR).
  const { data: member } = await supabase
    .from('company_members')
    .select('id')
    .eq('company_id', company_id)
    .eq('clerk_user_id', userId)
    .single();

  if (!member) {
    return { unrestricted: false, allowed_department_ids: [], allowed_roles: [] };
  }

  const { data: rows } = await supabase
    .from('employee_departments')
    .select('department_id, departments(name)')
    .eq('member_id', member.id);

  const dept_ids: string[] = [];
  let isHr = false;
  type DeptRow = {
    department_id: string;
    departments: { name: string } | { name: string }[] | null;
  };
  for (const r of (rows ?? []) as DeptRow[]) {
    dept_ids.push(r.department_id);
    const dept = Array.isArray(r.departments) ? r.departments[0] : r.departments;
    if (dept?.name === 'HR') isHr = true;
  }

  if (isHr) {
    return { unrestricted: true, allowed_department_ids: [], allowed_roles: [] };
  }

  return {
    unrestricted: false,
    allowed_department_ids: dept_ids,
    allowed_roles: ['manager', 'employee'],
  };
}
