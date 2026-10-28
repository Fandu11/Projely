
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { updateTask } from "./actions";

export const instant = false;

type EditTaskPageProps = {
  params: Promise<{
    id: string;
    taskId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

const statusOptions = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "TO_REVIEW", label: "À revoir" },
  { value: "DONE", label: "Terminé" },
] as const;

const priorityOptions = [
  { value: "LOW", label: "Faible" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL", label: "Critique" },
] as const;

const typeOptions = [
  { value: "TASK", label: "Tâche" },
  { value: "BUG", label: "Bug" },
] as const;

export default function EditTaskPage(props: EditTaskPageProps) {
  return (
    <Suspense fallback={<EditTaskFallback />}>
      <EditTaskContent {...props} />
    </Suspense>
  );
}

async function EditTaskContent({
  params,
  searchParams,
}: EditTaskPageProps) {
  const { id: projectId, taskId } = await params;
  const query = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Charger le projet uniquement si l'utilisateur y a accès.
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
    },
  });

  if (!project) {
    notFound();
  }

  // La tâche est directement liée au projet par projectId.
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId: project.id,
    },
  });

  if (!task) {
    notFound();
  }

  // Toutes les Stories du projet, y compris celles sans Epic.
  const stories = await prisma.story.findMany({
    where: {
      projectId: project.id,
    },
    select: {
      id: true,
      title: true,
      epic: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  // Sprints du projet qui ne sont pas terminés.
  const sprints = await prisma.sprint.findMany({
    where: {
      projectId: project.id,
      status: {
        not: "COMPLETED",
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Le propriétaire et les membres peuvent être assignés.
  const members = [
    project.owner,
    ...project.members.filter(
      (member) => member.id !== project.owner.id,
    ),
  ];

  const errorMessages: Record<string, string> = {
    invalid: "Vérifie le titre, la description et les champs sélectionnés.",
    story: "La Story sélectionnée n'appartient pas à ce projet.",
    sprint: "Le Sprint sélectionné n'appartient pas à ce projet.",
    assignee: "La personne choisie n'est pas membre de ce projet.",
  };

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <Link
        href={`/projects/${projectId}`}
        className="text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Retour au tableau
      </Link>

      <header className="mt-5">
        <h1 className="text-3xl font-bold text-slate-900">
          Modifier la tâche
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Projet : {project.name}
        </p>
      </header>

      {query.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessages[query.error] ??
            "Une erreur est survenue. Vérifie les informations saisies."}
        </p>
      )}

      <form
        action={updateTask.bind(null, projectId, taskId)}
        className="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium"
          >
            Titre *
          </label>

          <input
            id="title"
            name="title"
            required
            maxLength={150}
            defaultValue={task.title}
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            defaultValue={task.description ?? ""}
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium"
            >
              Statut
            </label>

            <select
              id="status"
              name="status"
              defaultValue={task.status}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="mb-2 block text-sm font-medium"
            >
              Priorité
            </label>

            <select
              id="priority"
              name="priority"
              defaultValue={task.priority}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-sm font-medium"
          >
            Type
          </label>

          <select
            id="type"
            name="type"
            defaultValue={task.type}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="storyId"
            className="mb-2 block text-sm font-medium"
          >
            Story associée
          </label>

          <select
            id="storyId"
            name="storyId"
            defaultValue={task.storyId ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
          >
            <option value="">Aucune Story</option>

            {stories.map((story) => (
              <option key={story.id} value={story.id}>
                {story.epic?.name
                  ? `${story.epic.name} — ${story.title}`
                  : story.title}
              </option>
            ))}
          </select>

          {stories.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Aucune Story disponible. Tu peux enregistrer la tâche sans
              Story associée.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="sprintId"
            className="mb-2 block text-sm font-medium"
          >
            Sprint associé
          </label>

          <select
            id="sprintId"
            name="sprintId"
            defaultValue={task.sprintId ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
          >
            <option value="">Aucun Sprint</option>

            {sprints.map((sprint) => (
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
            className="mb-2 block text-sm font-medium"
          >
            Assigner à une personne
          </label>

          <select
            id="assigneeId"
            name="assigneeId"
            defaultValue={task.assigneeId ?? ""}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
          >
            <option value="">Personne</option>

            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.email}
                {member.email ? ` — ${member.email}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            href={`/projects/${projectId}`}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Annuler
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </main>
  );
}

function EditTaskFallback() {
  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-10 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-[34rem] animate-pulse rounded-xl border border-slate-200 bg-white" />
    </main>
  );
}
