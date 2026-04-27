"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Printer } from "lucide-react";

interface Props {
  joinUrl: string;
  companyName: string;
}

export function JoinQrClient({ joinUrl, companyName }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-start sm:gap-8">
      {/* QR code */}
      <div className="shrink-0 rounded-xl border border-[color:var(--dc-edge)] bg-white p-3 shadow-xs">
        <QRCodeSVG value={joinUrl} size={128} />
      </div>

      {/* Info + actions */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dc-text">
          {companyName} — Employee Join QR
        </p>
        <p className="mt-1 text-sm text-dc-text-2 max-w-md">
          Print this code and post it on the floor. Employees scan it on their
          phone, enter the number you pre-registered, and their account is
          created instantly — no app download required.
        </p>

        <p className="mt-3 truncate rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 font-mono text-xs text-dc-text-3">
          {joinUrl}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay"
          >
            {copied ? (
              <Check className="size-3.5 text-green-500" strokeWidth={2.5} />
            ) : (
              <Copy className="size-3.5" strokeWidth={2} />
            )}
            {copied ? "Copied!" : "Copy link"}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay print:hidden"
          >
            <Printer className="size-3.5" strokeWidth={2} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
