import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { RateLimitResult } from "@/lib/types/export";

const MAX_EXPORTS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

// Reads data_export_events via the admin client because that table is revoked
// from anon and authenticated roles — only the service-role can read it.
// Admin client justified: reading our own audit table for rate-limiting, not tenant data.
export async function checkExportRateLimit(
  company_id: string,
): Promise<RateLimitResult> {
  const admin = getAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data, error } = await admin
    .from("data_export_events")
    .select("exported_at")
    .eq("company_id", company_id)
    .gte("exported_at", windowStart)
    .order("exported_at", { ascending: true });

  if (error) {
    // Fail open on DB error — don't block legitimate exports over a monitoring hiccup.
    // The error still surfaces in server logs for alerting.
    console.error("[export-rate-limit] db error:", error.message);
    return {
      allowed: true,
      remaining: MAX_EXPORTS_PER_HOUR,
      reset_at: new Date(Date.now() + WINDOW_MS).toISOString(),
    };
  }

  const count = (data ?? []).length;
  const oldest = data?.[0]?.exported_at;
  const reset_at = oldest
    ? new Date(new Date(oldest).getTime() + WINDOW_MS).toISOString()
    : new Date(Date.now() + WINDOW_MS).toISOString();

  return {
    allowed: count < MAX_EXPORTS_PER_HOUR,
    remaining: Math.max(0, MAX_EXPORTS_PER_HOUR - count),
    reset_at,
  };
}
