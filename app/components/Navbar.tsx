
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import LogoutButton from "@/app/components/LogoutButton";

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      {/* Barre de recherche */}
      <form
        action="/projects"
        method="GET"
        className="flex w-full max-w-xl items-center gap-2"
      >
        <input
          type="search"
          name="q"
          placeholder="Rechercher un projet..."
          aria-label="Rechercher un projet"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Rechercher
        </button>
      </form>

      {/* Partie droite : selon la session */}
      {session?.user ? (
        <div className="flex shrink-0 items-center gap-4">
          {/* Utilisateur connecté */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {(session.user.name?.trim().charAt(0) ||
                session.user.email?.charAt(0) ||
                "U"
              ).toUpperCase()}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                {session.user.name || "Utilisateur"}
              </p>
              <p className="text-xs text-slate-500">
                {session.user.email}
              </p>
            </div>
          </Link>

          <LogoutButton />
        </div>
      ) : (
        /* Utilisateur déconnecté */
        <Link
          href="/login"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Se connecter
        </Link>
      )}
    </header>
  );
}
