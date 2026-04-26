'use client';

import { useState } from 'react';
import { Lock, MessageCircle } from 'lucide-react';

interface Props {
  qr_code_id: string;          // empty string in preview mode
  label?: string;
  /** When false, the Request access button is disabled (used in builder preview). */
  interactive?: boolean;
  /** Optional helper text for the manager to set context — e.g. "Safety team only". */
  audience_summary?: string;
}

export function AccessDeniedView({
  qr_code_id,
  label,
  interactive = true,
  audience_summary,
}: Props) {
  const [note,    setNote]    = useState('');
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  async function requestAccess() {
    if (!interactive || !qr_code_id) return;
    setStatus('sending');
    setErrMsg(null);
    try {
      const res = await fetch(`/api/qr/${qr_code_id}/request-access`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setStatus('error');
        setErrMsg(j?.error?.message ?? 'Could not send the request');
        return;
      }
      setStatus('sent');
    } catch {
      setStatus('error');
      setErrMsg('Could not reach the server');
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-6 py-10 text-center">
      <span
        aria-hidden
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-(--color-brand)/10 text-(--color-brand)"
      >
        <Lock className="size-7" strokeWidth={1.75} />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-xl font-semibold text-dc-text">
          This one isn&apos;t for you — yet
        </h1>
        <p className="text-sm text-dc-text-2">
          {label ? <>The QR code <strong className="text-dc-text">{label}</strong> is</> : <>This QR code is</>}{' '}
          set up for a different team.{' '}
          {audience_summary ? <span className="text-dc-text-3">({audience_summary})</span> : null}
        </p>
        <p className="text-sm text-dc-text-3">
          If you think you should have access, send a quick note and your manager
          will take a look. No harm in asking.
        </p>
      </div>

      {status === 'sent' ? (
        <p className="rounded-lg border border-(--color-signal-ok) bg-(--color-signal-ok)/10 px-4 py-3 text-sm text-(--color-signal-ok)">
          Request sent. Your manager will get back to you.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!interactive || status === 'sending'}
            rows={3}
            maxLength={500}
            placeholder={interactive ? 'Optional: why do you need access?' : 'Optional note from the worker'}
            className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={requestAccess}
            disabled={!interactive || status === 'sending'}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageCircle className="size-4" strokeWidth={2} />
            {status === 'sending' ? 'Sending…' : 'Request access'}
          </button>
          {status === 'error' && errMsg && (
            <p className="text-xs text-(--color-signal-urgent)" role="alert">{errMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
