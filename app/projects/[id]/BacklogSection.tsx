
"use client";

import Link from "next/link";

type TaskStatus = "TODO" | "IN_PROGRESS" | "TO_REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type TaskType = "TASK" | "BUG";

type BacklogTask = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
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

const statusLabels: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TO_REVIEW: "À revoir",
  DONE: "Terminée",
};

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  TO_REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "text-slate-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600",
};

function TaskList({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: BacklogTask[];
}) {
  if (tasks.length === 0) {
    return (
      <p className="py-2 text-sm text-slate-500">
        Aucune tâche associée à cette Story.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/projects/${projectId}/tasks/${task.id}/edit`}
            className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  task.type === "BUG"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {task.type === "BUG" ? "Bug" : "Tâche"}
              </span>

              <span className="break-words text-sm font-medium text-slate-900">
                {task.title}
              </span>
            </span>

            <span className="flex flex-wrap items-center gap-3">
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
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StoryList({
  projectId,
  stories,
}: {
  projectId: string;
  stories: BacklogStory[];
}) {
  if (stories.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aucune Story pour le moment.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {stories.map((story) => (
        <li
          key={story.id}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4"
        >
          <div className="mb-3 flex items-start gap-2">
            <span className="shrink-0 rounded bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
              Story
            </span>

            <h4 className="break-words font-semibold text-slate-900">
              {story.title}
            </h4>
          </div>

          <div className="ml-2 border-l-2 border-violet-200 pl-3 sm:ml-4 sm:pl-4">
            <TaskList
              projectId={projectId}
              tasks={story.tasks}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function BacklogSection({
  projectId,
  epics = [],
  standaloneStories = [],
  standaloneTasks = [],
}: BacklogSectionProps) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Epics et leurs Stories
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {epics.length} Epic(s)
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {epics.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun Epic dans ce projet.
            </p>
          ) : (
            <ul className="space-y-4">
              {epics.map((epic) => (
                <li
                  key={epic.id}
                  className="rounded-xl border border-amber-200 p-3 sm:p-4"
                >
                  <div className="mb-4 flex items-start gap-2">
                    <span className="shrink-0 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                      Epic
                    </span>

                    <h3 className="break-words font-bold text-slate-900">
                      {epic.name}
                    </h3>

                    <span className="ml-auto shrink-0 text-xs text-slate-500">
                      {epic.stories.length} Story(s)
                    </span>
                  </div>

                  <div className="ml-2 border-l-2 border-amber-200 pl-3 sm:ml-4 sm:pl-4">
                    <StoryList
                      projectId={projectId}
                      stories={epic.stories}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Stories sans Epic
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {standaloneStories.length} Story(s) sans Epic
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <StoryList
            projectId={projectId}
            stories={standaloneStories}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Tâches et bugs sans Story
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {standaloneTasks.length} élément(s)
          </p>
        </div>

        {standaloneTasks.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune tâche ou aucun bug sans Story.
          </p>
        ) : (
          <ul className="space-y-2">
            {standaloneTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/projects/${projectId}/tasks/${task.id}/edit`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800">
                      {task.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {task.type === "BUG" ? "Bug" : "Tâche"}
                    </span>
                  </span>

                  <span className="shrink-0 text-xs text-slate-500">
                    {task.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
