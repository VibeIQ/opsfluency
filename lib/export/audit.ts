import "server-only";

import { createHash } from "crypto";

import { getAdminClient } from "@/lib/supabase/admin";
import type { ExportFormat } from "@/lib/types/export";

interface WriteAuditRowParams {
  company_id: string;
  exported_by: string;
  format: ExportFormat;
  entity_scope: string;
  row_count?: number;
  request: Request;
}

// Admin client justified: data_export_events is revoked from anon/authenticated.
// This is our own audit infrastructure, not tenant data.
export async function writeExportAuditRow(
  params: WriteAuditRowParams,
): Promise<void> {
  const { company_id, exported_by, format, entity_scope, row_count, request } =
    params;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ip_hash = createHash("sha256").update(ip).digest("hex");

  const admin = getAdminClient();
  const { error } = await admin.from("data_export_events").insert({
    company_id,
    exported_by,
    format,
    entity_scope,
    row_count: row_count ?? null,
    ip_hash,
  });

  if (error) {
    // Log but don't throw — a failed audit row must not block the export itself.
    // Alert on repeated failures in production monitoring.
    console.error("[export-audit] failed to write audit row:", error.message);
  }
}
