"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: { code: string; message?: string } };

function fail(code: string, message?: string): { ok: false; error: { code: string; message?: string } } {
  return { ok: false, error: { code, message } };
}

// ── Assign / remove ───────────────────────────────────────────────────────────

const AssignInput = z.object({
  department_id: z.string().uuid(),
  member_id:     z.string().uuid(),
});

export async function assignMemberToDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");
  const parsed = AssignInput.parse({
    department_id: formData.get("department_id"),
    member_id:     formData.get("member_id"),
  });

  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("id", parsed.department_id)
    .eq("company_id", company_id)
    .single();
  if (!dept) throw new Error("Department not found");

  const { error } = await supabase
    .from("employee_departments")
    .insert({ company_id, department_id: parsed.department_id, member_id: parsed.member_id });
  if (error) throw error;

  revalidatePath("/dashboard/departments");
}

export async function removeMemberFromDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");
  const parsed = AssignInput.parse({
    department_id: formData.get("department_id"),
    member_id:     formData.get("member_id"),
  });

  const { error } = await supabase
    .from("employee_departments")
    .delete()
    .eq("department_id", parsed.department_id)
    .eq("member_id", parsed.member_id)
    .eq("company_id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/departments");
}

// ── Role toggle (manager ↔ employee, never touches admin) ─────────────────────

const RoleInput = z.object({
  member_id: z.string().uuid(),
  role:      z.enum(["manager", "employee"]),
});

export async function updateMemberRole(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { member_id, role } = RoleInput.parse(raw);

    // Verify the target member belongs to this company and is not an admin.
    const { data: target } = await supabase
      .from("company_members")
      .select("id, role")
      .eq("id", member_id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (!target) return fail("NOT_FOUND");
    if (target.role === "admin") return fail("FORBIDDEN", "Cannot change an admin's role");

    const { error } = await supabase
      .from("company_members")
      .update({ role })
      .eq("id", member_id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/departments");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_INPUT");
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}

// ── Manager contact phone ──────────────────────────────────────────────────────

const PhoneInput = z.object({
  member_id:     z.string().uuid(),
  contact_phone: z.string().max(30).nullable(),
});

export async function updateMemberContactPhone(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { member_id, contact_phone } = PhoneInput.parse(raw);

    const { error } = await supabase
      .from("company_members")
      .update({ contact_phone: contact_phone?.trim() || null })
      .eq("id", member_id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/departments");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_INPUT");
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}

// ── HR contacts CRUD ───────────────────────────────────────────────────────────

const HrContactSchema = z.object({
  name:       z.string().min(1).max(100),
  title:      z.string().min(1).max(100),
  category:   z.string().min(1).max(80).default("General Questions"),
  email:      z.string().email().nullable().optional(),
  phone:      z.string().max(30).nullable().optional(),
  is_primary: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export async function createHrContact(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const input = HrContactSchema.parse(raw);

    const { data, error } = await supabase
      .from("hr_contacts")
      .insert({ ...input, company_id })
      .select("id")
      .single();

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/departments");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_INPUT");
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}

export async function updateHrContact(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const input = HrContactSchema.partial().parse(raw);

    const { error } = await supabase
      .from("hr_contacts")
      .update(input)
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/departments");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_INPUT");
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}

export async function deleteHrContact(id: string): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");

    const { error } = await supabase
      .from("hr_contacts")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/departments");
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}
