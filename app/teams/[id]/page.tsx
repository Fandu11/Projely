
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

import {
  addTeamMember,
  deleteTeam,
  removeTeamMember,
  updateTeam,
} from "../actions";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Vérifie les informations saisies.",
  "user-not-found": "Aucun compte Projectly ne correspond à cet e-mail.",
  "already-member": "Cet utilisateur fait déjà partie de l'équipe.",
  "cannot-remove-owner": "Le propriétaire ne peut pas être retiré de l'équipe.",
};

const successMessages: Record<string, string> = {
  updated: "Les informations de l'équipe ont été mises à jour.",
  "member-added": "Le membre a été ajouté à l'équipe.",
  "member-removed": "Le membre a été retiré de l'équipe.",
};

export default async function TeamDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const team = await prisma.team.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: { id: session.user.id },
          },
        },
      ],
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
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      projects: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const isOwner = team.ownerId === session.user.id;

  return (
    <main className="min-w-0 p-6 md:p-8">
      <Link
        href="/teams"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Retour aux équipes
      </Link>

      <header className="mb-8 flex flex-wrap items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700">
          {team.name.slice(0, 1).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">
              {team.name}
            </h1>
            {isOwner && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Propriétaire
              </span>
            )}
          </div>

          <p className="mt-2 max-w-2xl whitespace-pre-wrap text-slate-600">
            {team.description || "Aucune description renseignée."}
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Créée le{" "}
            {team.createdAt.toLocaleDateString("fr-FR")}
          </p>
        </div>
      </header>

      {query.error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessages[query.error] ?? "Une erreur est survenue."}
        </p>
      )}

      {query.success && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {successMessages[query.success] ?? "Opération effectuée."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {isOwner && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Informations de l'équipe
              </h2>

              <form action={updateTeam} className="mt-5 space-y-4">
                <input type="hidden" name="teamId" value={team.id} />

                <div>
                  <label
                    htmlFor="team-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nom
                  </label>
                  <input
                    id="team-name"
                    name="name"
                    required
                    maxLength={80}
                    defaultValue={team.name}
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
                    rows={3}
                    maxLength={500}
                    defaultValue={team.description ?? ""}
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Enregistrer les modifications
                </button>
              </form>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Membres
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {team.members.length} membre
                  {team.members.length > 1 ? "s" : ""}
                </p>
              </div>

              {isOwner && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  Gestion des membres
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {team.members.map((member) => {
                const isMemberOwner = member.id === team.ownerId;

                return (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">
                        {(member.name || member.email)
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {member.name || "Utilisateur"}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMemberOwner ? (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                          Propriétaire
                        </span>
                      ) : isOwner ? (
                        <form action={removeTeamMember}>
                          <input
                            type="hidden"
                            name="teamId"
                            value={team.id}
                          />
                          <input
                            type="hidden"
                            name="memberId"
                            value={member.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Retirer
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Projets associés
            </h2>

            {team.projects.length === 0 ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Aucun projet n'est associé à cette équipe pour le moment.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  L'association des équipes aux projets sera ajoutée
                  dans une prochaine étape.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {team.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
                  >
                    {project.name} →
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {isOwner && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Ajouter un membre
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                L'utilisateur doit déjà posséder un compte Projectly.
                Il recevra l'accès à l'équipe immédiatement.
              </p>

              <form action={addTeamMember} className="mt-5 space-y-3">
                <input type="hidden" name="teamId" value={team.id} />

                <div>
                  <label
                    htmlFor="member-email"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Adresse e-mail
                  </label>
                  <input
                    id="member-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    placeholder="collaborateur@exemple.fr"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Ajouter à l'équipe
                </button>
              </form>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Responsable
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700">
                {(team.owner.name || team.owner.email)
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {team.owner.name || "Utilisateur"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {team.owner.email}
                </p>
              </div>
            </div>
          </section>

          {isOwner && (
            <section className="rounded-xl border border-red-200 bg-white p-5">
              <h2 className="font-semibold text-red-700">
                Zone de danger
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                La suppression de cette équipe est définitive.
              </p>

              <form action={deleteTeam} className="mt-4 space-y-3">
                <input type="hidden" name="teamId" value={team.id} />
                <label
                  htmlFor="delete-confirmation"
                  className="block text-sm font-medium text-slate-700"
                >
                  Tape SUPPRIMER pour confirmer
                </label>
                <input
                  id="delete-confirmation"
                  name="confirmation"
                  required
                  pattern="SUPPRIMER"
                  title="Saisis exactement SUPPRIMER."
                  placeholder="SUPPRIMER"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Supprimer l'équipe
                </button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
