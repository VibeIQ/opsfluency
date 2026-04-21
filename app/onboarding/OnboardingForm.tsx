"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createCompanyAction, type CreateCompanyState } from "./actions";

const INITIAL_STATE: CreateCompanyState = { status: "idle" };

export function OnboardingForm() {
  const [state, formAction] = useActionState(createCompanyAction, INITIAL_STATE);
  const nameError = state.status === "error" ? state.fieldErrors?.name?.[0] : undefined;
  const phoneError = state.status === "error" ? state.fieldErrors?.phone?.[0] : undefined;
  const topError = state.status === "error" ? formatTopError(state) : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {topError ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {topError}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-dc-text">
          Company name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={200}
          autoComplete="organization"
          placeholder="Acme Manufacturing"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "name-error" : undefined}
          className="px-4 py-3 rounded-md border border-dc-edge bg-dc-raised text-dc-text placeholder:text-dc-text-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
        />
        {nameError ? (
          <p id="name-error" className="text-sm text-red-300">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="text-sm font-medium text-dc-text">
          Company phone <span className="text-dc-text-2 font-normal">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          maxLength={50}
          autoComplete="tel"
          placeholder="(555) 123-4567"
          aria-invalid={Boolean(phoneError)}
          aria-describedby={phoneError ? "phone-error" : undefined}
          className="px-4 py-3 rounded-md border border-dc-edge bg-dc-raised text-dc-text placeholder:text-dc-text-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
        />
        {phoneError ? (
          <p id="phone-error" className="text-sm text-red-300">
            {phoneError}
          </p>
        ) : null}
        <p className="text-xs text-dc-text-2">
          Shown in the QR code print header. You can change this later in settings.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 px-6 py-3 rounded-md bg-[var(--color-brand)] text-[#0C0E14] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Creating your workspace…" : "Create company"}
    </button>
  );
}

function formatTopError(state: Extract<CreateCompanyState, { status: "error" }>): string {
  switch (state.code) {
    case "UNAUTHENTICATED":
      return "Your session expired. Sign in again to continue.";
    case "ALREADY_MEMBER":
      return "You already belong to a company. Opening your dashboard…";
    case "INVALID_INPUT":
      return state.fieldErrors ? "Fix the highlighted fields and try again." : "Invalid input.";
    case "INTERNAL":
      return state.message ?? "Something went wrong creating your company.";
  }
}
