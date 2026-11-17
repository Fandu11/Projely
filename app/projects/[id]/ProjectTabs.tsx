
"use client";

import {
  useActionState,
  useState,
  useTransition,
} from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import BacklogSection from "./BacklogSection";
import SprintsSection from "./SprintsSection";
import ProjectSettings from "./ProjectSettings";

import {
  addProjectMember,
  removeProjectMember,
  updateStorySprint,
  updateStoryTaskAssignee,
  updateStoryTaskStatus,
  type MemberActionState,
} from "./actions";
import {
  getStoryAssignees,
  getStoryStatus,
  type StoryStatus,
} from "./story-utils";

type ProjectMember = {
  id: string;
  name: string | null;
  email: string;
};

type SprintStory = {
  id: string;
  title: string;
  sprintId: string;
  epicName: string | null;
  assignees: ProjectMember[];
  taskCount: number;
  completedTaskCount: number;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

type ProjectSprint = {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  totalStories: number;
  completedStories: number;
  stories: SprintStory[];
};

type BacklogTask = {
  id: string;
  title: string;
  type: "TASK" | "BUG";
  status: "TODO" | "IN_PROGRESS" | "TO_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assignee: ProjectMember | null;
};

type BacklogStory = {
  id: string;
  title: string;
  description: string | null;
  sprintId: string | null;
  tasks: BacklogTask[];
};

type BacklogEpic = {
  id: string;
  name: string;
  stories: BacklogStory[];
};

type ProjectTabsProps = {
  projectId: string;
  currentUserId: string;
  ownerId: string;
  owner: ProjectMember;
  members: ProjectMember[];
  tasksContent: ReactNode;
  calendarContent: ReactNode;
  sprints: ProjectSprint[];
  epics: BacklogEpic[];
  standaloneStories: BacklogStory[];
  standaloneTasks: BacklogTask[];
  projectName: string;
  projectDescription: string | null;
};

const tabs = [
  { id: "tasks", label: "Tâches" },
  { id: "backlog", label: "Backlog" },
  { id: "sprints", label: "Sprints" },
  { id: "calendar", label: "Vue calendrier" },
  { id: "members", label: "Membres" },
  { id: "settings", label: "Paramètres" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const initialMemberState: MemberActionState = {};

const taskStatusLabels: Record<BacklogTask["status"], string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TO_REVIEW: "À revoir",
  DONE: "Terminée",
};

const storyStatusLabels: Record<StoryStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
};

const storyStatusStyles: Record<StoryStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

function TaskStatusControl({
  projectId,
  storyId,
  task,
  onUpdated,
}: {
  projectId: string;
  storyId: string;
  task: BacklogTask;
  onUpdated: (
    taskId: string,
    status: BacklogTask["status"],
  ) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function updateStatus(status: BacklogTask["status"]) {
    setError("");

    startTransition(async () => {
      const result = await updateStoryTaskStatus(
        projectId,
        storyId,
        task.id,
        status,
      );

      if (!result.success) {
        setError(result.error ?? "Impossible de modifier l'état.");
        return;
      }

      onUpdated(task.id, status);
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <label htmlFor={`task-status-${task.id}`} className="sr-only">
        État de la sous-tâche {task.title}
      </label>
      <select
        id={`task-status-${task.id}`}
        value={task.status}
        onChange={(event) =>
          updateStatus(
            event.target.value as BacklogTask["status"],
          )
        }
        disabled={isPending}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
      >
        {Object.entries(taskStatusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function TaskAssigneeControl({
  projectId,
  storyId,
  task,
  assignees,
  onUpdated,
}: {
  projectId: string;
  storyId: string;
  task: BacklogTask;
  assignees: ProjectMember[];
  onUpdated: (taskId: string, assignee: ProjectMember | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function updateAssignee(assigneeId: string) {
    setError("");
    const assignee =
      assignees.find((person) => person.id === assigneeId) ?? null;

    startTransition(async () => {
      const result = await updateStoryTaskAssignee(
        projectId,
        storyId,
        task.id,
        assigneeId || null,
      );

      if (!result.success) {
        setError(
          result.error ?? "Impossible de modifier le responsable.",
        );
        return;
      }

      onUpdated(task.id, assignee);
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <label htmlFor={`task-assignee-${task.id}`} className="sr-only">
        Personne assignée à la sous-tâche {task.title}
      </label>
      <select
        id={`task-assignee-${task.id}`}
        value={task.assignee?.id ?? ""}
        onChange={(event) => updateAssignee(event.target.value)}
        disabled={isPending}
        className="max-w-36 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
      >
        <option value="">Non assignée</option>
        {assignees.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name || person.email}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function StorySprintAssignment({
  projectId,
  story,
  sprints,
}: {
  projectId: string;
  story: BacklogStory;
  sprints: ProjectSprint[];
}) {
  const router = useRouter();
  const [selectedSprintId, setSelectedSprintId] = useState(
    story.sprintId ?? "",
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const availableSprints = sprints.filter(
    (sprint) =>
      sprint.status !== "COMPLETED" ||
      sprint.id === story.sprintId,
  );

  function updateSprintAssignment(sprintId: string) {
    setError("");
    setSelectedSprintId(sprintId);

    startTransition(async () => {
      const result = await updateStorySprint(
        projectId,
        story.id,
        sprintId || null,
      );

      if (!result.success) {
        setSelectedSprintId(story.sprintId ?? "");
        setError(result.error ?? "Impossible de déplacer la Story.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex items-center gap-2">
        <label
          htmlFor={`story-sprint-${story.id}`}
          className="sr-only"
        >
          Sprint de la story {story.title}
        </label>
        <select
          id={`story-sprint-${story.id}`}
          value={selectedSprintId}
          onChange={(event) => updateSprintAssignment(event.target.value)}
          disabled={isPending}
          className="max-w-52 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        >
          <option value="">Aucun sprint</option>
          {availableSprints.map((sprint) => (
            <option
              key={sprint.id}
              value={sprint.id}
              disabled={sprint.status === "COMPLETED"}
            >
              {sprint.name}
              {sprint.status === "COMPLETED" ? " (terminé)" : ""}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProjectTabs({
  projectId,
  projectName,
  projectDescription,
  currentUserId,
  ownerId,
  owner,
  members,
  tasksContent,
  calendarContent,
  sprints,
  epics,
  standaloneStories,
  standaloneTasks,
}: ProjectTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedStory, setSelectedStory] =
    useState<BacklogStory | null>(null);

  const tabParam = searchParams.get("tab");
  const activeTab: TabId = tabs.some((item) => item.id === tabParam)
    ? (tabParam as TabId)
    : "tasks";

  const allMembers = [
    { ...owner, role: "Propriétaire" },
    ...members
      .filter((member) => member.id !== owner.id)
      .map((member) => ({
        ...member,
        role: "Membre",
      })),
  ];
  const assignees = [owner, ...members.filter((member) => member.id !== owner.id)];

  const [memberState, memberFormAction, isAddingMember] = useActionState(
    addProjectMember.bind(null, projectId),
    initialMemberState,
  );

  const projectStories = [
    ...epics.flatMap((epic) =>
      epic.stories.map((story) => ({
        ...story,
        epicName: epic.name,
      })),
    ),
    ...standaloneStories.map((story) => ({
      ...story,
      epicName: null,
    })),
  ];

  const unfinishedStories = projectStories.filter((story) => {
    const isUnfinished =
      story.tasks.length === 0 ||
      story.tasks.some((task) => task.status !== "DONE");

    return isUnfinished && story.sprintId === null;
  });

  const hasUnfinishedStories = projectStories.some(
    (story) =>
      story.tasks.length === 0 ||
      story.tasks.some((task) => task.status !== "DONE"),
  );

  return (
    <div>
      <nav
        className="mb-6 flex gap-6 overflow-x-auto border-b border-slate-200"
        aria-label="Sections du projet"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", tab.id);

              router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
              });
            }}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "tasks" && tasksContent}

      {activeTab === "backlog" && (
        <BacklogSection
          projectId={projectId}
          epics={epics}
          standaloneStories={standaloneStories}
          standaloneTasks={standaloneTasks ?? []}
        />
      )}

      {activeTab === "sprints" && (
        <div className="space-y-8">
          <SprintsSection
            projectId={projectId}
            sprints={sprints}
            onStoryClick={(storyId) => {
              const story = projectStories.find(
                (item) => item.id === storyId,
              );

              if (story) {
                setSelectedStory(story);
              }
            }}
          />

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Stories non terminées
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {unfinishedStories.length} story(s) sans sprint à organiser
              </p>
            </div>

            {unfinishedStories.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                {hasUnfinishedStories
                  ? "Toutes les stories non terminées sont déjà placées dans un sprint."
                  : "Toutes les stories du projet sont terminées."}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {unfinishedStories.map((story) => {
                  const remainingTasks = story.tasks.filter(
                    (task) => task.status !== "DONE",
                  ).length;

                  return (
                    <div
                      key={story.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => setSelectedStory(story)}
                          className="truncate text-left hover:text-blue-700"
                        >
                          {story.title}
                        </button>
                      </span>

                      {story.epicName && (
                        <span className="text-xs text-slate-500">
                          Epic : {story.epicName}
                        </span>
                      )}

                      <span className="text-xs font-medium text-amber-600">
                        {remainingTasks} tâche(s) restante(s)
                      </span>

                      <StorySprintAssignment
                        projectId={projectId}
                        story={story}
                        sprints={sprints}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "calendar" && calendarContent}

      {activeTab === "members" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Membres du projet
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {allMembers.length} personne(s) dans ce projet
            </p>
          </div>

          {currentUserId === ownerId && (
            <form
              action={memberFormAction}
              className="mb-6 rounded-lg border border-slate-200 p-4"
            >
              <label
                htmlFor="member-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Ajouter un membre par e-mail
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="member-email"
                  name="email"
                  type="email"
                  required
                  placeholder="exemple@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAddingMember ? "Ajout..." : "Ajouter"}
                </button>
              </div>

              {memberState.error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {memberState.error}
                </p>
              )}

              {memberState.success && (
                <p role="status" className="mt-3 text-sm text-green-700">
                  {memberState.success}
                </p>
              )}
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {allMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 py-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                  {(member.name || member.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {member.name || "Sans nom"}
                  </p>

                  <p className="truncate text-sm text-slate-500">
                    {member.email}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {member.role}
                </span>

                {currentUserId === ownerId && member.id !== ownerId && (
                  <form
                    action={removeProjectMember.bind(null, projectId)}
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        `Retirer ${
                          member.name || member.email
                        } de ce projet ?`,
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input
                      type="hidden"
                      name="memberId"
                      value={member.id}
                    />

                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Retirer
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "settings" && (
        <ProjectSettings
          projectId={projectId}
          projectName={projectName}
          projectDescription={projectDescription}
          isOwner={currentUserId === ownerId}
        />
      )}

      {selectedStory && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedStory(null);
            }
          }}
        >
          <aside
            className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-panel-title"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Story
                </p>
                <h2
                  id="story-panel-title"
                  className="mt-1 break-words text-xl font-semibold text-slate-900"
                >
                  {selectedStory.title}
                </h2>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${storyStatusStyles[getStoryStatus(selectedStory.tasks)]}`}
                >
                  {storyStatusLabels[getStoryStatus(selectedStory.tasks)]}
                </span>
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500">
                    Personnes assignées
                  </p>
                  {getStoryAssignees(selectedStory.tasks).length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {getStoryAssignees(selectedStory.tasks).map((person) => (
                        <span
                          key={person.id}
                          className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                        >
                          {person.name || person.email}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Aucune personne assignée
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fermer le détail de la story"
              >
                ×
              </button>
            </header>

            <div className="space-y-6 p-6">
              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedStory.description ||
                    "Aucune description pour cette story."}
                </p>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Progression
                  </h3>
                  <span className="text-sm text-slate-500">
                    {
                      selectedStory.tasks.filter(
                        (task) => task.status === "DONE",
                      ).length
                    }
                    /{selectedStory.tasks.length} tâches terminées
                  </span>
                </div>

                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`Progression de ${selectedStory.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    selectedStory.tasks.length > 0
                      ? Math.round(
                          (selectedStory.tasks.filter(
                            (task) => task.status === "DONE",
                          ).length /
                            selectedStory.tasks.length) *
                            100,
                        )
                      : 0
                  }
                >
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${
                        selectedStory.tasks.length > 0
                          ? Math.round(
                              (selectedStory.tasks.filter(
                                (task) => task.status === "DONE",
                              ).length /
                                selectedStory.tasks.length) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Tâches associées
                </h3>

                {selectedStory.tasks.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Aucune tâche associée à cette story.
                  </p>
                ) : (
                  <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {selectedStory.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            task.status === "DONE"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <Link
                            href={`/projects/${projectId}/tasks/${task.id}/edit`}
                            className="block truncate text-sm font-medium text-slate-800 hover:text-blue-700"
                          >
                            {task.title}
                          </Link>
                          <span className="text-xs text-slate-500">
                            {task.type === "BUG" ? "Bug" : "Tâche"}
                          </span>
                        </span>
                        <TaskStatusControl
                          projectId={projectId}
                          storyId={selectedStory.id}
                          task={task}
                          onUpdated={(taskId, status) => {
                            setSelectedStory((current) =>
                              current
                                ? {
                                    ...current,
                                    tasks: current.tasks.map(
                                      (currentTask) =>
                                        currentTask.id === taskId
                                          ? {
                                              ...currentTask,
                                              status,
                                            }
                                          : currentTask,
                                    ),
                                  }
                                : current,
                            );
                          }}
                        />
                        <TaskAssigneeControl
                          projectId={projectId}
                          storyId={selectedStory.id}
                          task={task}
                          assignees={assignees}
                          onUpdated={(taskId, assignee) => {
                            setSelectedStory((current) =>
                              current
                                ? {
                                    ...current,
                                    tasks: current.tasks.map(
                                      (currentTask) =>
                                        currentTask.id === taskId
                                          ? {
                                              ...currentTask,
                                              assignee,
                                            }
                                          : currentTask,
                                    ),
                                  }
                                : current,
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Sprint
                </h3>
                <div className="mt-3">
                  <StorySprintAssignment
                    key={selectedStory.id}
                    projectId={projectId}
                    story={selectedStory}
                    sprints={sprints}
                  />
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}