
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

import { createProjectElement } from "./actions";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
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

const errorMessages: Record<string, string> = {
  invalid: "Certains champs sont invalides. Vérifie les informations saisies.",
  parent:
    "Le parent sélectionné est invalide ou n'appartient pas à ce projet.",
  sprint: "Le Sprint sélectionné n'appartient pas à ce projet.",
  assignee: "Le responsable sélectionné n'appartient pas à ce projet.",
};

export default async function NewProjectElementPage({
  params,
  searchParams,
}: PageProps) {
  const { id: projectId } = await params;
  const { error } = await searchParams;

  // Authentification
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Chargement du projet et de ses éléments
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { id: userId } } },
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
        },
      },

      // Toutes les Stories du projet, y compris celles sans Epic.
      stories: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          epicId: true,
          epic: {
            select: {
              name: true,
            },
          },
        },
      },

      sprints: {
        where: {
          status: { not: "COMPLETED" },
        },
        orderBy: { startDate: "asc" },
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

  // Récupération du propriétaire
  const owner = await prisma.user.findUnique({
    where: { id: project.ownerId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const users = [
    ...(owner ? [owner] : []),
    ...project.members.filter(
      (member) => member.id !== project.ownerId,
    ),
  ];

  const formAction = createProjectElement.bind(null, project.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-gray-500 transition hover:text-gray-900"
        >
          ← Retour au projet
        </Link>

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
        action={formAction}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Type */}
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
            Epic → aucun parent. Story → Epic facultatif. Task ou Bug →
            Story facultative.
          </p>
        </div>

        {/* Titre */}
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

        {/* Description */}
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

        {/* Parent */}
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
              {project.stories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.title}
                  {story.epic
                    ? ` — ${story.epic.name}`
                    : " — sans Epic"}
                </option>
              ))}
            </optgroup>
          </select>

          <p className="mt-1.5 text-xs text-gray-500">
            Le serveur vérifie que le parent correspond au type choisi et
            appartient bien au projet.
          </p>
        </div>

        {/* Statut et priorité */}
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

        {/* Sprint */}
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
                {sprint.name} — {sprint.status.toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Responsable */}
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
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Annuler
          </Link>

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
