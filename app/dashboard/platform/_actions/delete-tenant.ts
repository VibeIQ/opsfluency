"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

const Input = z.object({
  company_id: z.string().uuid(),
});

export type DeleteTenantResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Permanently destroy a tenant and all its data. Uses the service-role
 * client so CASCADE deletes propagate across every company-scoped table
 * without RLS blocking the writes. Clerk accounts for the tenant's
 * members are NOT touched — users can re-onboard if needed.
 *
 * This is intentionally not guarded by is_demo. Super admins can delete
 * any tenant; the type-to-confirm UI in the client is the safety gate.
 */
export async function deleteTenant(formData: FormData): Promise<DeleteTenantResult> {
  try {
    await getSuperAdminContext();

    const { company_id } = Input.parse({ company_id: formData.get("company_id") });

    const admin = getAdminClient();

    // Cascade: company_members, departments, sops, qr_codes, qr_scans,
    // announcements, team_invites, labels, tags, ai_call_log, etc. all
    // reference companies(id) ON DELETE CASCADE.
    const { error } = await admin
      .from("companies")
      .delete()
      .eq("id", company_id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/platform");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Invalid company ID." };
    return { ok: false, error: e instanceof Error ? e.message : "Delete failed." };
  }
}
