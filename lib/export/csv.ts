import "server-only";

import type {
  GlossaryTermExport,
  SopExport,
  TeamMemberExport,
} from "@/lib/types/export";

// RFC 4180 CSV serializer. No external dependency needed.
// Values with commas, quotes, or newlines are wrapped in double-quotes;
// embedded quotes are escaped as "". Arrays are pipe-joined before escaping.
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = Array.isArray(value) ? value.join("|") : String(value);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  return lines.join("\r\n");
}

export function buildSopsCsv(sops: SopExport[]): string {
  const headers = [
    "id",
    "title",
    "status",
    "template",
    "department_id",
    "created_by",
    "created_at",
    "updated_at",
    "archived_at",
    "tag_ids",
  ];
  const rows = sops.map((s) => [
    s.id,
    s.title,
    s.status,
    s.template,
    s.department_id,
    s.created_by,
    s.created_at,
    s.updated_at,
    s.archived_at,
    s.tags,
  ]);
  return buildCsv(headers, rows);
}

export function buildGlossaryCsv(terms: GlossaryTermExport[]): string {
  const headers = [
    "id",
    "term_en",
    "definition_en",
    "term_es",
    "definition_es",
    "created_by",
    "created_at",
    "updated_at",
    "deleted_at",
    "tag_ids",
  ];
  const rows = terms.map((t) => [
    t.id,
    t.term_en,
    t.definition_en,
    t.term_es,
    t.definition_es,
    t.created_by,
    t.created_at,
    t.updated_at,
    t.deleted_at,
    t.tags,
  ]);
  return buildCsv(headers, rows);
}

export function buildTeamCsv(members: TeamMemberExport[]): string {
  const headers = [
    "id",
    "clerk_user_id",
    "role",
    "is_owner",
    "preferred_language",
    "invited_at",
    "joined_at",
    "locked_at",
    "department_ids",
    "email_note",
  ];
  const rows = members.map((m) => [
    m.id,
    m.clerk_user_id,
    m.role,
    m.is_owner,
    m.preferred_language,
    m.invited_at,
    m.joined_at,
    m.locked_at,
    m.department_ids,
    "Email address stored in Clerk - not available here",
  ]);
  return buildCsv(headers, rows);
}
