import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";

import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  try {
    await getCompanyContext();
    redirect("/dashboard");
  } catch (e) {
    if (!(e instanceof AuthError) || e.code !== "NO_COMPANY") throw e;
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
        className="flex-1 flex items-center justify-center px-6 py-16"
      >
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex flex-col gap-3 text-center">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Create your company
            </h1>
            <p className="text-dc-text-2">
              This sets up your admin account, seeds the four default departments
              (Safety, Equipment, Process, HR), and opens the manager dashboard.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
