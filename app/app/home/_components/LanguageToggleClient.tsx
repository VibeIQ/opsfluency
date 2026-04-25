"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { setLanguagePreference } from "@/app/dashboard/sops/_actions";
import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  current: WorkerLanguage;
}

export function LanguageToggleClient({ current }: Props) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pick(lang: WorkerLanguage) {
    if (lang === current || isPending) return;
    startTransition(async () => {
      await setLanguagePreference({ language: lang });
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("lang", lang);
      window.location.replace(`/app/home?${params.toString()}`);
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex shrink-0 rounded-full border border-[color:var(--dc-edge)] bg-dc-raised p-0.5"
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          aria-pressed={current === l}
          className={[
            "min-h-[44px] min-w-[44px] rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
            current === l
              ? "bg-(--color-brand) text-white"
              : "text-dc-text-2 hover:text-dc-text",
          ].join(" ")}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
