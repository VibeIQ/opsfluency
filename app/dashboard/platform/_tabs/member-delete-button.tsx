"use client";

import { useState, useTransition } from "react";
import { UserX } from "lucide-react";

import { deleteMember } from "@/app/dashboard/platform/_actions/delete-member";

interface MemberDeleteButtonProps {
  memberId: string;
  companyId: string;
  clerkUserId: string;
}

export function MemberDeleteButton({ memberId, companyId, clerkUserId }: MemberDeleteButtonProps) {
  const [stage, setStage] = useState<"idle" | "confirm">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFirstClick() {
    setStage("confirm");
    setError(null);
  }

  function handleCancel() {
    setStage("idle");
    setError(null);
  }

  function handleConfirm() {
    if (isPending) return;
    const fd = new FormData();
    fd.append("member_id", memberId);
    fd.append("company_id", companyId);

    startTransition(async () => {
      const result = await deleteMember(fd);
      if (!result.ok) {
        setError(result.error);
        setStage("idle");
      }
    });
  }

  if (stage === "confirm") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-md border border-[color:var(--dc-edge)] px-2.5 py-1 text-xs font-medium text-dc-text-3 hover:bg-dc-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20"
          >
            {isPending ? "Removing…" : "Remove from DB"}
          </button>
        </div>
        <p className="text-[10px] text-dc-text-3">
          Clerk account kept. DB rows only.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleFirstClick}
        title={`Remove ${clerkUserId} from database`}
        className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] px-2.5 py-1 text-xs font-medium text-dc-text-3 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
      >
        <UserX className="size-3" strokeWidth={2} />
        Remove
      </button>
      {error ? <p className="text-[10px] text-red-400">{error}</p> : null}
    </div>
  );
}
