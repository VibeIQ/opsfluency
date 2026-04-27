import { notFound } from "next/navigation";

import { getAdminClient } from "@/lib/supabase/admin";
import { ClaimForm } from "./_components/ClaimForm";

interface PageProps {
  params: Promise<{ company_id: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { company_id } = await params;

  const admin = getAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("name, logo_url")
    .eq("id", company_id)
    .maybeSingle();

  if (!company) notFound();

  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-2xl bg-(--color-brand)/10 text-2xl font-bold text-(--color-brand)">
              {company.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-(--color-brand) uppercase">
              OpsFluency
            </p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {company.name}
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Claim your account
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Enter the phone number your manager used to invite you.
            </p>
          </div>

          <ClaimForm companyId={company_id} companyName={company.name} />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Powered by OpsFluency &mdash; frontline knowledge for every worker
        </p>
      </div>
    </main>
  );
}
