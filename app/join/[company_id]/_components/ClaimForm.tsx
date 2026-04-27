"use client";

import { useActionState } from "react";
import { Phone, ArrowRight, Loader2 } from "lucide-react";

import { claimInvite, type ClaimState } from "../_actions/claim-invite";

interface Props {
  companyId: string;
  companyName: string;
}

export function ClaimForm({ companyId, companyName }: Props) {
  const [state, action, isPending] = useActionState<ClaimState, FormData>(
    claimInvite,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="company_id" value={companyId} />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="phone-input"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Your phone number
        </label>
        <div className="relative">
          <Phone
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
          />
          <input
            id="phone-input"
            name="phone"
            type="tel"
            inputMode="numeric"
            required
            autoFocus
            placeholder="(555) 123-4567"
            className="w-full rounded-xl border border-zinc-200 bg-white py-3.5 pl-10 pr-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter the number your manager registered for you at {companyName}.
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-brand) py-3.5 text-base font-semibold text-white hover:bg-(--color-brand-hover) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/40 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Setting up your account…
          </>
        ) : (
          <>
            Join {companyName}
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </>
        )}
      </button>
    </form>
  );
}
