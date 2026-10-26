
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import LogoutButton from "@/app/components/LogoutButton";

export default async function DashboardPage() {
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
