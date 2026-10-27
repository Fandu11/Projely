
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createSprint } from "./actions";

type TaskType = "EPIC" | "STORY" | "TASK" | "BUG";
type TaskStatus = "TODO" | "IN_PROGRESS" | "TO_REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

type SprintTask = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  parentTaskId: string | null;
};

type SprintData = {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  totalTasks: number;
  completedTasks: number;
  tasks: SprintTask[];
};

type SprintFormState = {
  error?: string;
  success?: string;
};

type SprintsSectionProps = {
  projectId: string;
  sprints: SprintData[];
};

const taskTypeLabels: Record<TaskType, string> = {
  EPIC: "Epic",
  STORY: "Story",
  TASK: "Tâche",
  BUG: "Bug",
};

const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TO_REVIEW: "À vérifier",
  DONE: "Terminée",
};

const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const sprintStatusLabels: Record<SprintStatus, string> = {
  PLANNED: "Planifié",
  ACTIVE: "En cours",
  COMPLETED: "Terminé",
};

const taskTypeOrder: Record<TaskType, number> = {
  EPIC: 0,
  STORY: 1,
  TASK: 2,
  BUG: 3,
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Trie les tâches par type, puis par titre.
 * Les tâches parentes sont affichées avant leurs enfants.
 */
function sortTasks(tasks: SprintTask[]): SprintTask[] {
  return [...tasks].sort((a, b) => {
    const typeDifference = taskTypeOrder[a.type] - taskTypeOrder[b.type];

    if (typeDifference !== 0) {
      return typeDifference;
    }

    return a.title.localeCompare(b.title, "fr");
  });
}

function getTaskTree(tasks: SprintTask[]): {
  roots: SprintTask[];
  childrenByParent: Map<string, SprintTask[]>;
} {
  const taskIds = new Set(tasks.map((task) => task.id));
  const childrenByParent = new Map<string, SprintTask[]>();
  const roots: SprintTask[] = [];

  for (const task of tasks) {
    // Si le parent n'est pas dans ce sprint, la tâche devient une racine.
    if (!task.parentTaskId || !taskIds.has(task.parentTaskId)) {
      roots.push(task);
      continue;
    }

    const siblings = childrenByParent.get(task.parentTaskId) ?? [];
    siblings.push(task);
    childrenByParent.set(task.parentTaskId, siblings);
  }

  return {
    roots: sortTasks(roots),
    childrenByParent: new Map(
      [...childrenByParent.entries()].map(([parentId, children]) => [
        parentId,
        sortTasks(children),
      ]),
    ),
  };
}

function TaskTree({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: SprintTask[];
}) {
  const { roots, childrenByParent } = getTaskTree(tasks);
  const visited = new Set<string>();

  function renderTask(task: SprintTask, depth = 0): React.ReactNode {
    // Protection contre les cycles accidentels dans la hiérarchie.
    if (visited.has(task.id)) {
      return null;
    }

    visited.add(task.id);

    const children = childrenByParent.get(task.id) ?? [];

    return (
      <li key={task.id} className="list-none">
        <div
          className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ marginLeft: `${Math.min(depth, 5) * 16}px` }}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                {taskTypeLabels[task.type]}
              </span>

              <Link
                href={`/projects/${projectId}/tasks/${task.id}/edit`}
                className="break-words font-medium text-gray-900 hover:text-blue-600 hover:underline"
              >
                {task.title}
              </Link>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
              <span>{taskStatusLabels[task.status]}</span>
              <span aria-hidden="true">·</span>
              <span>Priorité : {taskPriorityLabels[task.priority]}</span>
            </div>
          </div>
        </div>

        {children.length > 0 && (
          <ul className="mt-2 space-y-2">
            {children.map((child) => renderTask(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">
        Aucune tâche associée à ce sprint pour le moment.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {roots.map((task) => renderTask(task))}
    </ul>
  );
}

export default function SprintsSection({
  projectId,
  sprints,
}: SprintsSectionProps) {
  const [showForm, setShowForm] = useState(false);

  const action = createSprint.bind(null, projectId);

  const [state, formAction, isPending] = useActionState<
    SprintFormState,
    FormData
  >(action, {});

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sprints</h2>
          <p className="mt-1 text-sm text-gray-600">
            Organise les tâches du projet en cycles de travail.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Annuler" : "+ Nouveau sprint"}
        </button>
      </div>

      {showForm && (
        <form
          action={formAction}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Créer un sprint
          </h3>

          <div>
            <label
              htmlFor="sprint-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nom du sprint
            </label>
            <input
              id="sprint-name"
              name="name"
              type="text"
              maxLength={100}
              required
              placeholder="Ex. Sprint 1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="sprint-goal"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Objectif
            </label>
            <textarea
              id="sprint-goal"
              name="goal"
              rows={3}
              maxLength={1000}
              placeholder="Quel est l'objectif de ce sprint ?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sprint-start-date"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Date de début
              </label>
              <input
                id="sprint-start-date"
                name="startDate"
                type="date"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="sprint-end-date"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Date de fin
              </label>
              <input
                id="sprint-end-date"
                name="endDate"
                type="date"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          {state.success && (
            <p role="status" className="text-sm text-green-700">
              {state.success}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Création..." : "Créer le sprint"}
          </button>
        </form>
      )}

      {sprints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <h3 className="font-medium text-gray-900">Aucun sprint</h3>
          <p className="mt-2 text-sm text-gray-600">
            Crée ton premier sprint pour organiser les tâches du projet.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sprints.map((sprint) => {
            const progress =
              sprint.totalTasks > 0
                ? Math.round(
                    (sprint.completedTasks / sprint.totalTasks) * 100,
                  )
                : 0;

            return (
              <article
                key={sprint.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sprint.name}
                    </h3>

                    {sprint.goal && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                        {sprint.goal}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-gray-500">
                      {formatDate(sprint.startDate)} –{" "}
                      {formatDate(sprint.endDate)}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {sprintStatusLabels[sprint.status]}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-medium text-gray-900">
                      {sprint.completedTasks}/{sprint.totalTasks} tâches ·{" "}
                      {progress} %
                    </span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-label={`Progression du sprint ${sprint.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-900">
                    Éléments du sprint
                  </h4>

                  <TaskTree projectId={projectId} tasks={sprint.tasks} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
