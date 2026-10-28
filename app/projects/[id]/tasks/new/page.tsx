
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { createTask } from "./actions";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

const taskTypes = [
  { value: "EPIC", label: "Epic" },
  { value: "STORY", label: "Story" },
  { value: "TASK", label: "Tâche" },
  { value: "BUG", label: "Bug" },
] as const;

const taskStatuses = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "TO_REVIEW", label: "À revoir" },
  { value: "DONE", label: "Terminée" },
] as const;

const taskPriorities = [
  { value: "LOW", label: "Faible" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL", label: "Critique" },
] as const;

export default function NewTaskPage(props: PageProps) {
  return (
    <Suspense fallback={<NewTaskFallback />}>
      <NewTaskContent {...props} />
    </Suspense>
  );
}

async function NewTaskContent({ params }: PageProps) {
  const { id: projectId } = await params;

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
        { members: { some: { id: session.user.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      members: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      epics: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          stories: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      sprints: {
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const users = [
    ...project.members,
    ...(project.members.some((member) => member.id === project.ownerId)
      ? []
      : await prisma.user.findMany({
          where: { id: project.ownerId },
          select: { id: true, name: true, email: true },
        })),
  ];

  const possibleParents = project.epics.flatMap((epic) => [
    {
      id: epic.id,
      label: `Epic — ${epic.name}`,
    },
    ...epic.stories.map((story) => ({
      id: story.id,
      label: `Story — ${story.title}`,
    })),
  ]);

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <Link
        href={`/projects/${project.id}`}
        className="text-sm text-slate-600 hover:text-indigo-600"
      >
        ← Retour au projet
      </Link>

      <header className="mb-8 mt-6">
        <p className="text-sm font-medium text-indigo-600">{project.name}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Créer un élément
        </h1>
        <p className="mt-2 text-slate-600">
          Crée un Epic, une Story, une tâche ou un bug pour ce projet.
        </p>
      </header>

      <form
        action={createTask.bind(null, project.id)}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue="TASK"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {taskTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Le type détermine la place de cet élément dans la hiérarchie.
          </p>
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Titre *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={1}
            maxLength={150}
            placeholder="Ex. Ajouter l'authentification"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={2000}
            placeholder="Décris le besoin, le travail à réaliser ou le problème rencontré..."
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue="TODO"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
            >
              {taskStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Priorité
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
            >
              {taskPriorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="parentTaskId"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Élément parent
          </label>
          <select
            id="parentTaskId"
            name="parentTaskId"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
          >
            <option value="">Aucun parent</option>
            {possibleParents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Tu peux laisser ce champ vide. Les règles de hiérarchie sont
            vérifiées lors de l'enregistrement.
          </p>
        </div>

        <div>
          <label
            htmlFor="sprintId"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Sprint
          </label>
          <select
            id="sprintId"
            name="sprintId"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
          >
            <option value="">Aucun sprint</option>
            {project.sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
                {sprint.status === "ACTIVE" ? " (En cours)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="assigneeId"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Responsable
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
          >
            <option value="">Personne</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Link
            href={`/projects/${project.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Créer l'élément
          </button>
        </div>
      </form>
    </main>
  );
}

function NewTaskFallback() {
  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-10 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-[40rem] animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </main>
  );
}
