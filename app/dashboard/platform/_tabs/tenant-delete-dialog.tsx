"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import { deleteTenant } from "@/app/dashboard/platform/_actions/delete-tenant";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TenantDeleteDialogProps {
  companyId: string;
  companyName: string;
}

export function TenantDeleteDialog({ companyId, companyName }: TenantDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmed = confirmText === companyName;

  function handleOpen() {
    setOpen(true);
    setConfirmText("");
    setError(null);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setConfirmText("");
    setError(null);
  }

  function handleSubmit() {
    if (!confirmed || isPending) return;
    setError(null);

    const fd = new FormData();
    fd.append("company_id", companyId);

    startTransition(async () => {
      const result = await deleteTenant(fd);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Delete tenant permanently"
        className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-colors"
      >
        <Trash2 className="size-3" strokeWidth={2} />
        Delete
      </button>

      <Dialog open={open} onClose={handleClose} size="md">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="size-5 text-red-400" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle>Delete &ldquo;{companyName}&rdquo; permanently?</DialogTitle>
            <DialogDescription>
              This wipes the tenant and every record it owns from the database:
              members, departments, SOPs, QR codes, scan logs, announcements,
              labels, AI usage history, and all other company-scoped data.{" "}
              <strong className="text-red-400">This cannot be undone.</strong>{" "}
              Clerk accounts for the tenant&apos;s members are not deleted — they
              can re-onboard as a new company if needed.
            </DialogDescription>
          </div>
        </div>

        <DialogBody>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <ul className="list-disc space-y-1 pl-4">
              <li>All members removed from this company</li>
              <li>All SOPs, QR codes, and scan analytics deleted</li>
              <li>All announcements and departments deleted</li>
              <li>All AI call logs for this tenant deleted</li>
              <li>Action is permanent and cannot be reversed</li>
            </ul>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-dc-text-2 mb-2">
              Type <span className="font-mono font-semibold text-dc-text">{companyName}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={companyName}
              autoComplete="off"
              disabled={isPending}
            />
          </div>

          {error ? (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          ) : null}
        </DialogBody>

        <DialogActions>
          <Button plain onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            color="red"
            disabled={!confirmed || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
