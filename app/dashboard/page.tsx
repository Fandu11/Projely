
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/lib/auth";
import LogoutButton from "@/app/components/LogoutButton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">
        Tableau de bord
      </h1>

      <p className="mt-4">
        Bienvenue, {session.user.name} !
      </p>

      <p className="mt-2 text-gray-600">
        {session.user.email}
      </p>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}

function DashboardFallback() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="h-9 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-6 w-56 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-5 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-10 w-36 animate-pulse rounded bg-slate-200" />
    </main>
  );
}
