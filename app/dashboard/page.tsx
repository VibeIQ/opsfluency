import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";

export default async function DashboardPage() {
  try {
    await getCompanyContext();
  } catch (e) {
    if (e instanceof AuthError && e.code === "NO_COMPANY") redirect("/onboarding");
    throw e;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-dc-edge">
        <span
          className="font-bold text-xl tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          OpsFluency
        </span>
        <UserButton />
      </header>
      <main
        id="main"
        className="flex-1 flex flex-col items-center justify-center px-6 py-24 gap-4 text-center"
      >
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Manager dashboard
        </h1>
        <p className="max-w-xl text-dc-text-2">
          The SOP import pipeline, glossary manager, employee invitations,
          announcements, monitors, and analytics will live here. We&apos;re
          scaffolding the foundation first.
        </p>
      </main>
    </div>
  );
}
