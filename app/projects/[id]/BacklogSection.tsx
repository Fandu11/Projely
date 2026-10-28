
"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  updateBacklogEpic,
  updateBacklogStory,
  deleteBacklogEpic,
  deleteBacklogStory,
} from "./actions";

type BacklogTask = {
  id: string;
  title: string;
  type: "TASK" | "BUG";
  status: "TODO" | "IN_PROGRESS" | "TO_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

type BacklogStory = {
  id: string;
  title: string;
  tasks: BacklogTask[];
};

type BacklogEpic = {
  id: string;
  name: string;
  stories: BacklogStory[];
};

type BacklogSectionProps = {
  projectId: string;
  epics?: BacklogEpic[];
  standaloneStories?: BacklogStory[];
  standaloneTasks?: BacklogTask[];
};

const statusLabels: Record<BacklogTask["status"], string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TO_REVIEW: "À revoir",
  DONE: "Terminée",
};

const priorityLabels: Record<BacklogTask["priority"], string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const statusColors: Record<BacklogTask["status"], string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  TO_REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

const priorityColors: Record<BacklogTask["priority"], string> = {
  LOW: "text-slate-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600",
};

function getTaskProgress(tasks: BacklogTask[]): number {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE",
  ).length;

  return Math.round((completedTasks / tasks.length) * 100);
}

function getStoryProgress(story: BacklogStory): number {
  return getTaskProgress(story.tasks);
}

function getEpicProgress(epic: BacklogEpic): number {
  const tasks = epic.stories.flatMap((story) => story.tasks);
  return getTaskProgress(tasks);
}

function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progression : ${value}%`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function CompactProgress({
  value,
  color,
  textColor,
}: {
  value: number;
  color: string;
  textColor: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="w-16 sm:w-20">
        <ProgressBar value={value} color={color} />
      </div>
      <span
        className={`min-w-9 text-right text-xs font-bold tabular-nums ${textColor}`}
      >
        {value}%
      </span>
    </div>
  );
}

function TaskList({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: BacklogTask[];
}) {
  if (tasks.length === 0) {
    return (
      <p className="py-3 text-sm text-slate-400">
        Aucune tâche ou aucun bug.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/projects/${projectId}/tasks/${task.id}/edit`}
          className={`flex flex-wrap items-center gap-2 rounded-lg border bg-white px-3 py-3 transition hover:bg-slate-50 ${
            task.type === "BUG"
              ? "border-red-200"
              : task.status === "DONE"
                ? "border-emerald-200"
                : "border-slate-200"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
              task.type === "BUG"
                ? "bg-red-100 text-red-700"
                : task.status === "DONE"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
            }`}
            aria-hidden="true"
          >
            {task.type === "BUG" ? "!" : "✓"}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-800">
              {task.title}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              {task.type === "BUG" ? "Bug" : "Tâche"}
            </span>
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[task.status]}`}
          >
            {statusLabels[task.status]}
          </span>

          <span
            className={`text-xs font-medium ${priorityColors[task.priority]}`}
          >
            {priorityLabels[task.priority]}
          </span>
        </Link>
      ))}
    </div>
  );
}

function StoryCard({
  projectId,
  story,
  epics,
  currentEpicId,
}: {
  projectId: string;
  story: BacklogStory;
  epics: BacklogEpic[];
  currentEpicId: string | null;
}) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(story.title);
  const [epicId, setEpicId] = useState(currentEpicId ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const progress = getStoryProgress(story);

  function saveStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await updateBacklogStory(
        projectId,
        story.id,
        title,
        epicId || null,
      );

      if (!result.success) {
        setError(result.error ?? "Erreur lors de la modification.");
        return;
      }

      setEditing(false);
      router.refresh();
    });
  }

  function cancelEditing() {
    setTitle(story.title);
    setEpicId(currentEpicId ?? "");
    setError("");
    setEditing(false);
  }

  function removeStory() {
    if (
      !window.confirm(
        `Supprimer la Story "${story.title}" ?`,
      )
    ) {
      return;
    }

    setError("");

    startTransition(async () => {
      const result = await deleteBacklogStory(projectId, story.id);

      if (!result.success) {
        setError(result.error ?? "Erreur lors de la suppression.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200 bg-white">
      <div className="border-b border-sky-100 bg-sky-50/80 p-3 sm:p-4">
        {editing ? (
          <form onSubmit={saveStory} className="space-y-4">
            <div>
              <label
                htmlFor={`story-title-${story.id}`}
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Titre de la Story
              </label>

              <input
                id={`story-title-${story.id}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={200}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label
                htmlFor={`story-epic-${story.id}`}
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Epic associée
              </label>

              <select
                id={`story-epic-${story.id}`}
                value={epicId}
                onChange={(event) => setEpicId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Aucune Epic</option>
                {epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={removeStory}
                disabled={isPending}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                Supprimer la Story
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={cancelEditing}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <span className="text-lg" aria-hidden="true">
                ◈
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="break-words font-semibold text-slate-900">
                {story.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {story.tasks.length} tâche(s) ou bug(s)
              </p>
            </div>

            <CompactProgress
              value={progress}
              color="bg-sky-600"
              textColor="text-sky-800"
            />

            <button
              type="button"
              onClick={() => {
                setTitle(story.title);
                setEpicId(currentEpicId ?? "");
                setError("");
                setEditing(true);
              }}
              className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Modifier
            </button>
          </div>
        )}
      </div>

      {!editing && (
        <div className="p-3">
          <TaskList projectId={projectId} tasks={story.tasks} />
        </div>
      )}
    </div>
  );
}

function EpicCard({
  projectId,
  epic,
  epics,
}: {
  projectId: string;
  epic: BacklogEpic;
  epics: BacklogEpic[];
}) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(epic.name);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const progress = getEpicProgress(epic);
  const totalTasks = epic.stories.reduce(
    (total, story) => total + story.tasks.length,
    0,
  );

  function saveEpic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await updateBacklogEpic(
        projectId,
        epic.id,
        name,
      );

      if (!result.success) {
        setError(result.error ?? "Erreur lors de la modification.");
        return;
      }

      setEditing(false);
      router.refresh();
    });
  }

  function removeEpic() {
    if (
      !window.confirm(
        `Supprimer l'Epic "${epic.name}" ?`,
      )
    ) {
      return;
    }

    setError("");

    startTransition(async () => {
      const result = await deleteBacklogEpic(projectId, epic.id);

      if (!result.success) {
        setError(result.error ?? "Erreur lors de la suppression.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
      <div className="border-b border-violet-200 bg-violet-50 p-3 sm:p-4">
        {editing ? (
          <form onSubmit={saveEpic} className="space-y-4">
            <div>
              <label
                htmlFor={`epic-name-${epic.id}`}
                className="mb-1.5 block text-sm font-semibold text-violet-900"
              >
                Nom de l&apos;Epic
              </label>

              <input
                id={`epic-name-${epic.id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={200}
                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </button>

              <button
                type="button"
                onClick={removeEpic}
                disabled={isPending}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                Supprimer l'Epic
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setName(epic.name);
                  setError("");
                  setEditing(false);
                }}
                className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-200 text-violet-800">
              <span className="text-xl" aria-hidden="true">
                ◆
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-base font-bold text-violet-950">
                  {epic.name}
                </h3>

                <span className="rounded-full bg-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-800">
                  Epic
                </span>
              </div>

              <p className="mt-1 text-sm text-violet-800/80">
                {epic.stories.length} Story(s) · {totalTasks} tâche(s) ou
                bug(s)
              </p>
            </div>

            <CompactProgress
              value={progress}
              color="bg-violet-600"
              textColor="text-violet-900"
            />

            <button
              type="button"
              onClick={() => {
                setName(epic.name);
                setError("");
                setEditing(true);
              }}
              className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100"
            >
              Modifier
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {epic.stories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-violet-200 bg-violet-50/50 p-4 text-sm text-slate-500">
            Aucune Story dans cette Epic.
          </p>
        ) : (
          epic.stories.map((story) => (
            <StoryCard
              key={story.id}
              projectId={projectId}
              story={story}
              epics={epics}
              currentEpicId={epic.id}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function BacklogSection({
  projectId,
  epics = [],
  standaloneStories = [],
  standaloneTasks = [],
}: BacklogSectionProps) {
  const totalStandaloneTasks = standaloneStories.reduce(
    (total, story) => total + story.tasks.length,
    0,
  );

  return (
    <div className="space-y-8">
      {/* Epics et leurs Stories */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                ◆
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Epics et Stories
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Organise les grandes fonctionnalités et suis leur progression.
            </p>
          </div>

          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-semibold text-violet-800">
            {epics.length} Epic(s)
          </span>
        </div>

        {epics.length === 0 ? (
          <p className="rounded-xl border border-dashed border-violet-300 bg-violet-50/40 p-5 text-sm text-slate-500">
            Aucune Epic pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {epics.map((epic) => (
              <EpicCard
                key={epic.id}
                projectId={projectId}
                epic={epic}
                epics={epics}
              />
            ))}
          </div>
        )}
      </section>

      {/* Stories indépendantes */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                ◈
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Stories sans Epic
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Des fonctionnalités qui ne sont pas encore rattachées à une Epic.
            </p>
          </div>

          <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-800">
            {standaloneStories.length} Story(s)
          </span>
        </div>

        {standaloneStories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-sky-300 bg-sky-50/40 p-5 text-sm text-slate-500">
            Aucune Story sans Epic.
          </p>
        ) : (
          <div className="space-y-3">
            {standaloneStories.map((story) => (
              <StoryCard
                key={story.id}
                projectId={projectId}
                story={story}
                epics={epics}
                currentEpicId={null}
              />
            ))}
          </div>
        )}

        {totalStandaloneTasks > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Ces Stories regroupent {totalStandaloneTasks} tâche(s) ou bug(s).
          </p>
        )}
      </section>

      {/* Tâches et bugs sans Story */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                ✓
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Tâches et bugs sans Story
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Les éléments indépendants, directement rattachés au projet.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
            {standaloneTasks.length} élément(s)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {standaloneTasks.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune tâche ou aucun bug sans Story.
            </p>
          ) : (
            <TaskList projectId={projectId} tasks={standaloneTasks} />
          )}
        </div>
      </section>
    </div>
  );
}
