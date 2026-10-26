
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { createTask } from "./actions";

export const instant = false;

const columns = [
  {
    status: "TODO",
    title: "À faire",
    color: "border-slate-400",
  },
  {
    status: "IN_PROGRESS",
    title: "En cours",
    color: "border-blue-500",
  },
  {
    status: "TO_REVIEW",
    title: "À revoir",
    color: "border-amber-500",
  },
  {
    status: "DONE",
    title: "Fini",
    color: "border-emerald-500",
  },
] as const;

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

const priorityLabels = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
} as const;

const priorityColors = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
} as const;

const typeLabels = {
  TASK: "Tâche",
  BUG: "Bug",
  STORY: "Story",
  EPIC: "Epic",
} as const;

export default function ProjectPage(props: ProjectPageProps) {
  return (
    <Suspense fallback={<ProjectFallback />}>
      <ProjectContent {...props} />
    </Suspense>
  );
}

async function ProjectContent({
  params,
  searchParams,
}: ProjectPageProps) {
  const { id: projectId } = await params;
  const query = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: {
              id: session.user.id,
            },
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
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="min-w-0 p-6 md:p-8">
      {/* En-tête du projet */}
      <Link
        href="/projects"
        className="text-sm text-slate-500 transition hover:text-indigo-600"
      >
        ← Retour à mes projets
      </Link>

      <header className="mb-8 mt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {project.name}
            </h1>

            {project.description && (
              <p className="mt-2 max-w-3xl whitespace-pre-wrap text-slate-600">
                {project.description}
              </p>
            )}

          </div>

          <Link
            href={`/projects/${project.id}/tasks/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <span className="text-lg">+</span>
            Nouvelle tâche
          </Link>
        </div>
      </header>

      {/* Message d'erreur éventuel */}
      {query.error === "invalid" && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          Vérifie le titre, la description et le statut de la tâche.
        </p>
      )}

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Membres du projet
        </h2>

        <div className="space-y-3">
          {/* Propriétaire du projet */}
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {(project.owner.name || project.owner.email)
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">
                {project.owner.name || "Sans nom"}
              </p>
              <p className="text-sm text-slate-500">
                {project.owner.email}
              </p>
            </div>

            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
              Propriétaire
            </span>
          </div>

          {/* Autres membres */}
          {project.members
            .filter((member) => member.id !== project.ownerId)
            .map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">
                  {(member.name || member.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {member.name || "Sans nom"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {member.email}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  Membre
                </span>
              </div>
            ))}

          {project.members.filter(
            (member) => member.id !== project.ownerId
          ).length === 0 && (
            <p className="text-sm text-slate-500">
              Aucun autre membre dans ce projet.
            </p>
          )}
        </div>
      </section>

      {/* Tableau Kanban */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map((column) => {
          const tasks = project.tasks.filter(
            (task) => task.status === column.status,
          );

          return (
            <section
              key={column.status}
              className="min-w-0 rounded-xl bg-slate-100 p-3"
            >
              {/* Titre de la colonne */}
              <div
                className={`mb-4 flex items-center justify-between border-t-4 ${column.color} pt-3`}
              >
                <h2 className="font-semibold text-slate-800">
                  {column.title}
                </h2>

                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                  {tasks.length}
                </span>
              </div>

              {/* Cartes de tâches */}
              <div className="space-y-3">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <h3 className="break-words font-semibold text-slate-900">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                        {task.description}
                      </p>
                    )}

                    {/* Type et priorité */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {typeLabels[task.type]}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${priorityColors[task.priority]}`}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </div>

                    {/* Assignation */}
                    <div className="mt-3 text-xs text-slate-500">
                      <span className="font-medium">Assigné à : </span>

                      {task.assignee?.name ||
                        task.assignee?.email ||
                        task.assignedGroup ||
                        "Personne"}
                    </div>

                    {/* Story ou Epic parente */}
                    {task.parentTask && (
                      <div className="mt-2 text-xs text-slate-500">
                        <span className="font-medium">Parent : </span>
                        {typeLabels[task.parentTask.type]} —{" "}
                        {task.parentTask.title}
                      </div>
                    )}

                    {/* Date de création */}
                    <p className="mt-3 text-xs text-slate-400">
                      Créée le{" "}
                      {task.createdAt.toLocaleDateString("fr-FR")}
                    </p>

                    {/* Modification */}
                    <Link
                      href={`/projects/${project.id}/tasks/${task.id}/edit`}
                      className="mt-4 inline-flex text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
                    >
                      Modifier la tâche →
                    </Link>
                  </article>
                ))}

                {/* Formulaire d'ajout rapide dans la colonne */}
                <form
                  action={createTask.bind(null, project.id)}
                  className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-white/70 p-3"
                >
                  <input
                    type="hidden"
                    name="status"
                    value={column.status}
                  />

                  <input
                    name="title"
                    required
                    minLength={1}
                    maxLength={150}
                    placeholder="Nom de la tâche..."
                    aria-label={`Nouvelle tâche : ${column.title}`}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <textarea
                    name="description"
                    maxLength={2000}
                    rows={2}
                    placeholder="Description (facultative)"
                    aria-label="Description de la tâche"
                    className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <button
                    type="submit"
                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                  >
                    + Ajouter une tâche
                  </button>
                </form>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function ProjectFallback() {
  return (
    <main className="min-w-0 p-6 md:p-8">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-10 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.status}
            className="h-72 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    </main>
  );
}
