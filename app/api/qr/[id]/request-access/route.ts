import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

import { getAdminClient } from '@/lib/supabase/admin';

const Body = z.object({
  note: z.string().trim().max(500).optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  if (!id) return fail(400, 'INVALID_INPUT', 'missing qr id');

  const { userId } = await auth();
  if (!userId) return fail(401, 'UNAUTHENTICATED');

  let parsed: z.infer<typeof Body>;
  try {
    const json = await request.json().catch(() => ({}));
    parsed = Body.parse(json);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(400, 'INVALID_INPUT', undefined, e.issues);
    throw e;
  }

  // Admin client: this endpoint is called from the deny page, where the
  // caller is authenticated by Clerk but doesn't necessarily have the right
  // RLS predicate (we still want to log the request even if their company
  // membership is being resolved). Justified RLS bypass — we manually scope
  // by qr.company_id and verify the user belongs to that company.
  const admin = getAdminClient();

  const { data: qr } = await admin
    .from('qr_codes')
    .select('id, company_id')
    .eq('id', id)
    .single();
  if (!qr) return fail(404, 'NOT_FOUND');

  // Only company members can file an access request — keeps cross-tenant
  // noise out of the inbox.
  const { data: member } = await admin
    .from('company_members')
    .select('id')
    .eq('clerk_user_id', userId)
    .eq('company_id', qr.company_id)
    .maybeSingle();
  if (!member) return fail(403, 'FORBIDDEN');

  const { error } = await admin
    .from('qr_access_requests')
    .insert({
      qr_code_id:   qr.id,
      company_id:   qr.company_id,
      requested_by: userId,
      note:         parsed.note ?? null,
    });
  if (error) return fail(500, 'INTERNAL', error.message);

  return NextResponse.json({ ok: true }, { status: 201 });
}

function fail(status: number, code: string, message?: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
