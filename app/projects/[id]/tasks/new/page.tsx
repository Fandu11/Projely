
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import {prisma} from "@/app/lib/prisma";

import { createProjectElement } from "./actions";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

const elementTypes = [
  { value: "EPIC", label: "Epic" },
  { value: "STORY", label: "Story" },
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
] as const;

const statuses = [
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "TO_REVIEW", label: "À vérifier" },
  { value: "DONE", label: "Terminé" },
] as const;

const priorities = [
  { value: "LOW", label: "Faible" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "CRITICAL", label: "Critique" },
] as const;

export default async function NewProjectElementPage({
  params,
  searchParams,
}: PageProps) {
  const { id: projectId } = await params;
  const { error } = await searchParams;

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
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          stories: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      sprints: {
        where: {
          status: {
            not: "COMPLETED",
          },
        },
        orderBy: {
          startDate: "asc",
        },
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

  const owner = await prisma.user.findUnique({
    where: {
      id: project.ownerId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const users = [
    ...(owner ? [owner] : []),
    ...project.members.filter((member) => member.id !== project.ownerId),
  ];

  const errorMessages: Record<string, string> = {
    invalid: "Certains champs sont invalides. Vérifie les informations saisies.",
    parent:
      "Le parent sélectionné ne correspond pas au type d'élément ou n'appartient pas à ce projet.",
    sprint: "Le sprint sélectionné n'existe pas dans ce projet.",
    assignee: "Le membre assigné ne fait pas partie de ce projet.",
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <a
          href={`/projects/${project.id}`}
          className="text-sm text-gray-500 transition hover:text-gray-900"
        >
          ← Retour au projet
        </a>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
          Créer un élément
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Projet : <span className="font-medium">{project.name}</span>
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Crée un Epic, une Story, une Task ou un Bug.
        </p>
      </div>

      {error && errorMessages[error] && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessages[error]}
        </div>
      )}

      <form
        action={createProjectElement.bind(null, project.id)}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="type"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Type d'élément
          </label>

          <select
            id="type"
            name="type"
            defaultValue="TASK"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {elementTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <p className="mt-1.5 text-xs text-gray-500">
            Tu peux laisser le parent vide pour créer un élément autonome.
          </p>
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Titre
          </label>

          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            placeholder="Ex. : Créer le système d'authentification"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Description
            <span className="ml-1 font-normal text-gray-400">
              (facultatif)
            </span>
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={5000}
            placeholder="Décris l'objectif et les détails de cet élément..."
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="parentId"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Élément parent
            <span className="ml-1 font-normal text-gray-400">
              (facultatif)
            </span>
          </label>

          <select
            id="parentId"
            name="parentId"
            defaultValue=""
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Aucun parent</option>

            <optgroup label="Epics">
              {project.epics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="Stories">
              {project.epics.flatMap((epic) =>
                epic.stories.map((story) => (
                  <option key={story.id} value={story.id}>
                    {story.title} — {epic.name}
                  </option>
                )),
              )}
            </optgroup>
          </select>

          <p className="mt-1.5 text-xs text-gray-500">
            Story → Epic facultatif. Task ou Bug → Story facultative.
            Epic → aucun parent.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Statut
            </label>

            <select
              id="status"
              name="status"
              defaultValue="TODO"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Priorité
            </label>

            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="sprintId"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Sprint
            <span className="ml-1 font-normal text-gray-400">
              (facultatif)
            </span>
          </label>

          <select
            id="sprintId"
            name="sprintId"
            defaultValue=""
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Aucun sprint</option>

            {project.sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status.toLowerCase()})
              </option>
            ))}
          </select>

          <p className="mt-1.5 text-xs text-gray-500">
            Ce champ est utilisé uniquement pour les Tasks et les Bugs.
          </p>
        </div>

        <div>
          <label
            htmlFor="assigneeId"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Assigné à
            <span className="ml-1 font-normal text-gray-400">
              (facultatif)
            </span>
          </label>

          <select
            id="assigneeId"
            name="assigneeId"
            defaultValue=""
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Personne</option>

            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <p className="mt-1.5 text-xs text-gray-500">
            L'assignation est utilisée uniquement pour les Tasks et les Bugs.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <a
            href={`/projects/${project.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Annuler
          </a>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Créer l'élément
          </button>
        </div>
      </form>
    </main>
  );
}
