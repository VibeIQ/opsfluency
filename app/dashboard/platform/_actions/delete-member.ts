"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

const Input = z.object({
  member_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export type DeleteMemberResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Remove a user's DB presence from a tenant without touching their Clerk
 * account. After this they can sign back in and go through onboarding
 * again as if they were new. Useful for clearing test users.
 *
 * Deletes:
 *  - company_members row (cascades to employee_departments)
 *  - team_invites they sent (nice-to-have cleanup)
 *
 * Intentionally preserved:
 *  - Clerk account and email
 *  - SOPs, announcements, qr_codes they created (business data)
 *  - qr_scans attributed to them
 */
export async function deleteMember(formData: FormData): Promise<DeleteMemberResult> {
  try {
    await getSuperAdminContext();

    const { member_id, company_id } = Input.parse({
      member_id: formData.get("member_id"),
      company_id: formData.get("company_id"),
    });

    const admin = getAdminClient();

    // Verify the member actually belongs to the stated company before
    // deleting — prevents a stray member_id from targeting another tenant.
    const { data: existing, error: lookupError } = await admin
      .from("company_members")
      .select("id, clerk_user_id")
      .eq("id", member_id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (lookupError) return { ok: false, error: lookupError.message };
    if (!existing) return { ok: false, error: "Member not found in this company." };

    // Clean up pending invites they sent so invite slots aren't wasted.
    await admin
      .from("team_invites")
      .delete()
      .eq("company_id", company_id)
      .eq("invited_by_clerk_user_id", existing.clerk_user_id)
      .eq("status", "pending");

    // Primary delete — cascades to employee_departments.
    const { error } = await admin
      .from("company_members")
      .delete()
      .eq("id", member_id)
      .eq("company_id", company_id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/platform");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Invalid input." };
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}
