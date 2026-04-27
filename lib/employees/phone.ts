/**
 * Normalize a raw phone string to E.164 format (+1XXXXXXXXXX for US numbers).
 * Accepts: 10 digits, 11 digits starting with 1, or already-formatted +1…
 * Returns null for anything that doesn't match a recognizable US pattern.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Format an E.164 US number for display: +15551234567 → (555) 123-4567.
 * Falls back to the raw string for non-US or unrecognized formats.
 */
export function formatPhoneDisplay(e164: string): string {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `(${m[1]}) ${m[2]}-${m[3]}`;
  return e164;
}
