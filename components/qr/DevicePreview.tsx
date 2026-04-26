'use client';

import { useState } from 'react';
import { ArrowUpRight, ExternalLink, Smartphone } from 'lucide-react';
import { AccessDeniedView } from './AccessDeniedView';

type PreviewMode = 'allowed' | 'denied';

interface Props {
  /** Label set on the QR — empty string falls back to a placeholder. */
  label: string;
  /** Destination URL preview (custom URL flow only). */
  url: string;
  /** Human summary of the audience scope, used in the denied preview. */
  audience_summary?: string;
}

/**
 * Side-by-side preview of what an end user sees after a successful or denied
 * scan. Pure presentation — no server calls, no real QR id. The "Request
 * access" button inside the denied view is disabled in this builder context.
 */
export function DevicePreview({ label, url, audience_summary }: Props) {
  const [mode, setMode] = useState<PreviewMode>('allowed');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.15em] text-dc-text-3 uppercase">
          Device preview
        </p>
        <div
          role="tablist"
          aria-label="Preview mode"
          className="inline-flex rounded-md border border-[color:var(--dc-edge)] bg-dc-raised p-0.5 text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'allowed'}
            onClick={() => setMode('allowed')}
            className={
              mode === 'allowed'
                ? 'rounded-sm bg-(--color-brand) px-3 py-1 font-medium text-white'
                : 'rounded-sm px-3 py-1 text-dc-text-2 hover:text-dc-text'
            }
          >
            In audience
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'denied'}
            onClick={() => setMode('denied')}
            className={
              mode === 'denied'
                ? 'rounded-sm bg-(--color-brand) px-3 py-1 font-medium text-white'
                : 'rounded-sm px-3 py-1 text-dc-text-2 hover:text-dc-text'
            }
          >
            Not in audience
          </button>
        </div>
      </div>

      <DeviceFrame>
        {mode === 'allowed' ? (
          <AllowedPreview label={label} url={url} />
        ) : (
          <AccessDeniedView
            qr_code_id=""
            label={label || undefined}
            interactive={false}
            audience_summary={audience_summary}
          />
        )}
      </DeviceFrame>

      <p className="text-xs text-dc-text-3">
        This is what a worker sees after scanning. Toggle between the two states
        to check that the messaging reads well in either case.
      </p>
    </div>
  );
}

function DeviceFrame({ children }: { children: React.ReactNode }) {
  // Phone-shaped frame: aspect ratio ~9/19, soft shadow, brand-tinted bezel.
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="rounded-[2.25rem] border border-[color:var(--dc-edge)] bg-dc-raised p-2 shadow-lg">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-dc-surface">
          {/* notch */}
          <div
            aria-hidden
            className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[color:var(--dc-edge)]"
          />
          <div className="flex min-h-[520px] flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}

function AllowedPreview({ label, url }: { label: string; url: string }) {
  const trimmed = url.trim();
  const display = trimmed || 'https://example.com';
  let host = '';
  try {
    host = new URL(trimmed).host;
  } catch {
    host = '';
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-2xl bg-(--color-brand)/10 text-(--color-brand)"
      >
        <Smartphone className="size-7" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg font-semibold text-dc-text">
          Opening {label || 'your link'}
        </p>
        <p className="text-sm text-dc-text-2">
          You&apos;ll be redirected to{' '}
          <span className="font-medium text-dc-text">{host || 'the destination'}</span>{' '}
          in your browser.
        </p>
      </div>
      <div className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-left">
        <p className="truncate text-xs text-dc-text-3" title={display}>
          <ExternalLink aria-hidden className="mr-1 inline size-3 -translate-y-px" />
          {display}
        </p>
      </div>
      <span
        aria-hidden
        className="inline-flex items-center gap-1 rounded-full bg-(--color-signal-ok)/10 px-3 py-1 text-xs font-medium text-(--color-signal-ok)"
      >
        <ArrowUpRight className="size-3" strokeWidth={2.5} />
        Access granted
      </span>
    </div>
  );
}
