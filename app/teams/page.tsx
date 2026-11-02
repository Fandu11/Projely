
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { createTeam } from "./actions";

export const instant = false;

type PageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function TeamsPage({ searchParams }: PageProps) {
  const query = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: { id: session.user.id },
          },
        },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
  });

  const errors: Record<string, string> = {
    invalid: "Vérifie le nom et la description de l'équipe.",
  };

  const successes: Record<string, string> = {
    deleted: "L'équipe a été supprimée.",
  };

  return (
    <main className="min-w-0 p-6 md:p-8">
      <header className="mb-8">
        <p className="mb-2 text-sm font-medium text-indigo-600">
          Collaboration
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Équipes
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Regroupe tes collaborateurs pour organiser le travail
              de tes projets.
            </p>
          </div>

          <a
            href="#create-team"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <span className="text-lg">+</span>
            Créer une équipe
          </a>
        </div>
      </header>

      {query.error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errors[query.error] ?? "Une erreur est survenue."}
        </p>
      )}

      {query.success && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {successes[query.success] ?? "Opération effectuée."}
        </p>
      )}

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Mes équipes" value={teams.length} />
        <StatCard
          label="Membres cumulés"
          value={teams.reduce(
            (total, team) => total + team.members.length,
            0,
          )}
        />
        <StatCard
          label="Projets associés"
          value={teams.reduce(
            (total, team) => total + team._count.projects,
            0,
          )}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Toutes les équipes
            </h2>
            <span className="text-sm text-slate-500">
              {teams.length} équipe{teams.length > 1 ? "s" : ""}
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="text-2xl">♧</span>
              </div>
              <h3 className="font-semibold text-slate-900">
                Aucune équipe pour le moment
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Crée ta première équipe puis ajoute les collaborateurs
                qui participeront à tes projets.
              </p>
              <a
                href="#create-team"
                className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Créer ma première équipe
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <span className="text-lg font-semibold">
                        {team.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {team.ownerId === session.user.id
                        ? "Propriétaire"
                        : "Membre"}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">
                    {team.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
                    {team.description || "Aucune description renseignée."}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>
                      {team.members.length} membre
                      {team.members.length > 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span>
                      {team._count.projects} projet
                      {team._count.projects > 1 ? "s" : ""}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium text-indigo-600">
                    Consulter l'équipe →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside
          id="create-team"
          className="h-fit rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Nouvelle équipe
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Commence par définir son identité.
            </p>
          </div>

          <form action={createTeam} className="space-y-4">
            <div>
              <label
                htmlFor="team-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Nom de l'équipe
              </label>
              <input
                id="team-name"
                name="name"
                required
                maxLength={80}
                placeholder="Ex. Équipe Développement"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="team-description"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Description
              </label>
              <textarea
                id="team-description"
                name="description"
                rows={4}
                maxLength={500}
                placeholder="Quel est le rôle de cette équipe ?"
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Créer l'équipe
            </button>

            <p className="text-xs leading-5 text-slate-500">
              Tu seras automatiquement propriétaire et membre de
              l'équipe créée.
            </p>
          </form>
        </aside>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
