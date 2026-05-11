'use client';

import { Images } from 'lucide-react';

import type { WorkerLanguage } from '@/lib/types/sop';

interface Props {
  lang: WorkerLanguage;
}

export function MediaScrollButton({ lang }: Props) {
  const label = lang === 'es' ? 'Ver medios' : 'View media';

  function scrollToMedia() {
    document.getElementById('sop-media')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={scrollToMedia}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2.5 text-sm font-semibold text-(--color-brand) hover:bg-(--color-brand)/20 active:bg-(--color-brand)/30 transition-colors"
      aria-label={label}
    >
      <Images className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
}
