
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { createTask } from "./actions";
import ProjectTabs from "./ProjectTabs";
import CalendarView from "./CalendarView";

export const instant = false;

const columns = [
  { status: "TODO", title: "À faire", color: "border-slate-400" },
  { status: "IN_PROGRESS", title: "En cours", color: "border-blue-500" },
  { status: "TO_REVIEW", title: "À revoir", color: "border-amber-500" },
  { status: "DONE", title: "Fini", color: "border-emerald-500" },
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
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sprints: {
        orderBy: [{ startDate: "asc" }, { endDate: "asc" }],
        include: {
          tasks: {
            where: {
              projectId,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              priority: true,
              storyId: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      },
      epics: {
        orderBy: { createdAt: "asc" },
        include: {
          stories: {
            orderBy: { createdAt: "asc" },
            include: {
              tasks: {
                where: { projectId },
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  title: true,
                  type: true,
                  status: true,
                  priority: true,
                  storyId: true,
                  sprintId: true,
                },
              },
            },
          },
        },
      },
      stories: {
        where: { epicId: null },
        orderBy: { createdAt: "asc" },
        include: {
          tasks: {
            where: { projectId },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              priority: true,
              storyId: true,
              sprintId: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Toutes les Stories du projet, y compris celles sans Epic.
  const stories = await prisma.story.findMany({
    where: {
      projectId: project.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      epic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Charger toutes les tâches du projet, y compris celles sans Story.
  const projectTasks = await prisma.task.findMany({
    where: {
      projectId: project.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      story: {
        select: {
          id: true,
          title: true,
          epic: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const standaloneTasks = await prisma.task.findMany({
    where: {
      projectId,
      storyId: null,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      priority: true,
    },
  });

  const tasks = projectTasks.map((task) => ({
    ...task,
    storyTitle: task.story?.title ?? "Aucune story",
    epicName: task.story?.epic?.name ?? "Aucun epic",
  }));

  // Préparer les données des sprints une seule fois pour les deux composants.
  const calendarSprints = project.sprints.map((sprint) => ({
    id: sprint.id,
    name: sprint.name,
    goal: sprint.goal,
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    status: sprint.status,
    totalTasks: sprint._count.tasks,
    completedTasks: sprint.tasks.filter(
      (task) => task.status === "DONE",
    ).length,
    tasks: sprint.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      type: task.type,
      status: task.status,
      priority: task.priority,
      storyId: task.storyId,
    })),
  }));

  return (
    <main className="min-w-0 p-6 md:p-8">
      <header className="mb-8 mt-0">
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

      {query.error === "invalid" && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          Vérifie le titre, la description et le statut de la tâche.
        </p>
      )}

      <ProjectTabs
        projectId={project.id}
        currentUserId={session.user.id}
        ownerId={project.ownerId}
        owner={project.owner}
        members={project.members}
        standaloneTasks={standaloneTasks}
        epics={project.epics.map((epic) => ({
          id: epic.id,
          name: epic.name,
          stories: epic.stories.map((story) => ({
            id: story.id,
            title: story.title,
            tasks: story.tasks.map((task) => ({
              id: task.id,
              title: task.title,
              type: task.type,
              status: task.status,
              priority: task.priority,
            })),
          })),
        }))}
        standaloneStories={project.stories.map((story) => ({
          id: story.id,
          title: story.title,
          tasks: story.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            type: task.type,
            status: task.status,
            priority: task.priority,
          })),
        }))}
        allTasks={tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          type: task.type,
          priority: task.priority,
          storyTitle: task.storyTitle,
          epicName: task.epicName,
          sprintId: task.sprintId,
        }))}
        sprints={calendarSprints}
        calendarContent={
          <CalendarView
            projectId={project.id}
            sprints={calendarSprints}
          />
        }
        tasksContent={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {columns.map((column) => {
              const columnTasks = tasks.filter(
                (task) => task.status === column.status,
              );

              return (
                <section
                  key={column.status}
                  className="min-w-0 rounded-xl bg-slate-100 p-3"
                >
                  <div
                    className={`mb-4 flex items-center justify-between border-t-4 ${column.color} pt-3`}
                  >
                    <h2 className="font-semibold text-slate-800">
                      {column.title}
                    </h2>

                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/projects/${project.id}/tasks/${task.id}/edit`}
                        aria-label={`Modifier la tâche : ${task.title}`}
                        className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <h3 className="break-words font-semibold text-slate-900">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                            {task.description}
                          </p>
                        )}

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

                        <div className="mt-3 break-words text-xs text-slate-500">
                          <p>
                            <span className="font-medium">Story :</span>{" "}
                            {task.storyTitle}
                          </p>

                          <p className="mt-1">
                            <span className="font-medium">Epic :</span>{" "}
                            {task.epicName}
                          </p>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                          <span className="font-medium">Assigné à : </span>
                          {task.assignee?.name ||
                            task.assignee?.email ||
                            "Personne"}
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Créée le{" "}
                          {task.createdAt.toLocaleDateString("fr-FR")}
                        </p>
                      </Link>
                    ))}

                    {/* Création rapide sans Story obligatoire */}
                    <form
                      action={createTask.bind(null, project.id)}
                      className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-white/70 p-3"
                    >
                      <input
                        type="hidden"
                        name="status"
                        value={column.status}
                      />

                      <label
                        htmlFor={`type-${column.status}`}
                        className="block text-xs font-medium text-slate-600"
                      >
                        Type
                      </label>

                      <select
                        id={`type-${column.status}`}
                        name="type"
                        defaultValue="TASK"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="TASK">Tâche</option>
                        <option value="BUG">Bug</option>
                      </select>

                      <label
                        htmlFor={`title-${column.status}`}
                        className="block text-xs font-medium text-slate-600"
                      >
                        Titre
                      </label>

                      <input
                        id={`title-${column.status}`}
                        name="title"
                        required
                        minLength={1}
                        maxLength={150}
                        placeholder="Nom de la tâche..."
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <label
                        htmlFor={`description-${column.status}`}
                        className="block text-xs font-medium text-slate-600"
                      >
                        Description (facultative)
                      </label>

                      <textarea
                        id={`description-${column.status}`}
                        name="description"
                        maxLength={2000}
                        rows={2}
                        placeholder="Description..."
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
        }
      />
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