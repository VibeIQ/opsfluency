import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

import type { Role } from "@/lib/auth/company-context";

interface PreviewBannerProps {
  role: Exclude<Role, "employee">;
}

/**
 * Shown above every `/app/*` page when an admin or manager is viewing
 * the worker PWA. Mirrors the impersonation banner pattern: a sticky
 * strip that can't be missed, with a one-click route back to the
 * dashboard. Employees never see this.
 */
export function PreviewBanner({ role }: PreviewBannerProps) {
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-(--color-brand)/40 bg-(--color-brand)/10 px-4 py-2 text-sm text-(--color-brand) backdrop-blur"
    >
      <span className="flex items-center gap-2 font-medium">
        <Eye className="size-4" strokeWidth={2} aria-hidden />
        Previewing the employee app as <span className="font-semibold capitalize">{role}</span>
      </span>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-md border border-(--color-brand)/40 bg-(--color-brand)/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase hover:bg-(--color-brand)/25"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to dashboard
      </Link>
    </div>
  );
}
