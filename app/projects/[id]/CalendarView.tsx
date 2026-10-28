
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "TO_REVIEW" | "DONE";
type TaskType = "TASK" | "BUG";

type CalendarTask = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  storyId: string | null;
};

export type CalendarSprint = {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  tasks: CalendarTask[];
};

type CalendarViewProps = {
  projectId: string;
  sprints: CalendarSprint[];
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TO_REVIEW: "À revoir",
  DONE: "Terminée",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  TO_REVIEW: "bg-amber-100 text-amber-800",
  DONE: "bg-emerald-100 text-emerald-700",
};

const PRIORITY_LABELS = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
} as const;

const PRIORITY_STYLES = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
} as const;

/**
 * Convertit une date ISO en date locale sans décalage de fuseau horaire.
 */
function toLocalDate(value: string): Date {
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  return toLocalDate(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(first: Date, second: Date): boolean {
  return dateKey(first) === dateKey(second);
}

function isSprintActiveOnDate(
  sprint: CalendarSprint,
  date: Date,
): boolean {
  const start = toLocalDate(sprint.startDate);
  const end = toLocalDate(sprint.endDate);

  return (
    dateKey(date) >= dateKey(start) &&
    dateKey(date) <= dateKey(end)
  );
}

function getMonthDays(month: Date): Date[] {
  const firstDay = new Date(
    month.getFullYear(),
    month.getMonth(),
    1,
  );

  const lastDay = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  );

  // JavaScript : dimanche = 0. Le calendrier commence le lundi.
  const offset = (firstDay.getDay() + 6) % 7;
  const numberOfDays = lastDay.getDate();
  const numberOfCells = Math.ceil((offset + numberOfDays) / 7) * 7;

  return Array.from({ length: numberOfCells }, (_, index) => {
    const dayNumber = index - offset + 1;

    return new Date(
      month.getFullYear(),
      month.getMonth(),
      dayNumber,
    );
  });
}

export default function CalendarView({
  projectId,
  sprints,
}: CalendarViewProps) {
  const [displayedMonth, setDisplayedMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(
    null,
  );

  const [showSprints, setShowSprints] = useState(true);
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    "ALL" | TaskStatus
  >("ALL");

  const today = new Date();

  const monthDays = useMemo(
    () => getMonthDays(displayedMonth),
    [displayedMonth],
  );

  const selectedSprint =
    sprints.find((sprint) => sprint.id === selectedSprintId) ?? null;

  const monthLabel = displayedMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const visibleSprints = useMemo(() => {
    return [...sprints]
      .filter((sprint) => {
        if (!showSprints) return false;

        const start = toLocalDate(sprint.startDate);
        const end = toLocalDate(sprint.endDate);
        const monthStart = new Date(
          displayedMonth.getFullYear(),
          displayedMonth.getMonth(),
          1,
        );
        const monthEnd = new Date(
          displayedMonth.getFullYear(),
          displayedMonth.getMonth() + 1,
          0,
        );

        return start <= monthEnd && end >= monthStart;
      })
      .sort(
        (a, b) =>
          toLocalDate(a.startDate).getTime() -
          toLocalDate(b.startDate).getTime(),
      );
  }, [displayedMonth, sprints, showSprints]);

  const allTasks = useMemo(() => {
    const seen = new Set<string>();

    return sprints.flatMap((sprint) =>
      sprint.tasks
        .filter((task) => {
          if (seen.has(task.id)) return false;
          seen.add(task.id);
          return true;
        })
        .map((task) => ({
          ...task,
          sprintId: sprint.id,
          sprintName: sprint.name,
        })),
    );
  }, [sprints]);

  const visibleTasks = allTasks.filter(
    (task) =>
      taskStatusFilter === "ALL" || task.status === taskStatusFilter,
  );

  const changeMonth = (offset: number) => {
    setDisplayedMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + offset,
          1,
        ),
    );
  };

  return (
    <section className="space-y-5">
      {/* En-tête et navigation du calendrier */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold capitalize text-slate-900">
            {monthLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Consulte les périodes de sprint et les tâches associées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mois précédent"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() =>
              setDisplayedMonth(
                new Date(today.getFullYear(), today.getMonth(), 1),
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Aujourd’hui
          </button>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mois suivant"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showSprints}
            onChange={(event) => setShowSprints(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />
          Afficher les sprints
        </label>

        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          Statut des tâches
          <select
            value={taskStatusFilter}
            onChange={(event) =>
              setTaskStatusFilter(
                event.target.value as "ALL" | TaskStatus,
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="TO_REVIEW">À revoir</option>
            <option value="DONE">Terminées</option>
          </select>
        </label>
      </div>

      {/* Calendrier mensuel */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-1 py-3 text-center text-xs font-semibold text-slate-500 sm:px-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((date) => {
            const isCurrentMonth =
              date.getMonth() === displayedMonth.getMonth();

            const isToday = isSameDay(date, today);

            const daySprints = visibleSprints.filter((sprint) =>
              isSprintActiveOnDate(sprint, date),
            );

            return (
              <div
                key={dateKey(date)}
                className={`min-h-24 min-w-0 border-b border-r border-slate-100 p-1 sm:min-h-32 sm:p-2 ${
                  isCurrentMonth ? "bg-white" : "bg-slate-50/70"
                }`}
              >
                <div className="mb-1 flex justify-center sm:justify-start">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-indigo-600 font-semibold text-white"
                        : isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-400"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                <div className="space-y-1">
                  {daySprints.slice(0, 3).map((sprint) => (
                    <button
                      key={sprint.id}
                      type="button"
                      onClick={() => setSelectedSprintId(sprint.id)}
                      title={`${sprint.name} — ${formatDate(
                        sprint.startDate,
                      )} au ${formatDate(sprint.endDate)}`}
                      className="block w-full truncate rounded-md bg-violet-100 px-1.5 py-1 text-left text-[10px] font-medium text-violet-800 transition hover:bg-violet-200 sm:text-xs"
                    >
                      <span className="mr-1">●</span>
                      {sprint.name}
                    </button>
                  ))}

                  {daySprints.length > 3 && (
                    <p className="px-1 text-[10px] text-slate-500">
                      +{daySprints.length - 3} autres
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
          Période d’un sprint
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          Aujourd’hui
        </span>
      </div>

      {/* Liste des sprints du mois */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">
            Sprints de ce mois
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {visibleSprints.length}
          </span>
        </div>

        {visibleSprints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-700">
              Aucun sprint sur cette période
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Essaie un autre mois ou crée un sprint.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleSprints.map((sprint) => {
              const progress =
                sprint.totalTasks > 0
                  ? Math.round(
                      (sprint.completedTasks / sprint.totalTasks) * 100,
                    )
                  : 0;

              return (
                <button
                  key={sprint.id}
                  type="button"
                  onClick={() => setSelectedSprintId(sprint.id)}
                  className={`rounded-xl border bg-white p-4 text-left transition hover:border-indigo-300 hover:shadow-sm ${
                    selectedSprintId === sprint.id
                      ? "border-indigo-400 ring-2 ring-indigo-100"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words font-semibold text-slate-900">
                        {sprint.name}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(sprint.startDate)} –{" "}
                        {formatDate(sprint.endDate)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-800">
                      Sprint
                    </span>
                  </div>

                  {sprint.goal && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {sprint.goal}
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>
                        {sprint.completedTasks} / {sprint.totalTasks} tâches
                        terminées
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Détail du sprint sélectionné */}
      {selectedSprint && (
        <section
          className="scroll-mt-6 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-6"
          aria-live="polite"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Détail du sprint
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {selectedSprint.name}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Du {formatDate(selectedSprint.startDate)} au{" "}
                {formatDate(selectedSprint.endDate)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSprintId(null)}
              className="self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>

          {selectedSprint.goal && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
              {selectedSprint.goal}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {(["TODO", "IN_PROGRESS", "TO_REVIEW", "DONE"] as const).map(
              (status) => {
                const count = selectedSprint.tasks.filter(
                  (task) => task.status === status,
                ).length;

                return (
                  <span
                    key={status}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
                  >
                    {STATUS_LABELS[status]} : {count}
                  </span>
                );
              },
            )}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold text-slate-900">
                Tâches et bugs du sprint
              </h4>
              <span className="text-xs text-slate-500">
                {visibleTasks.filter(
                  (task) => task.sprintId === selectedSprint.id,
                ).length}{" "}
                affiché(s)
              </span>
            </div>

            {selectedSprint.tasks.filter(
              (task) =>
                taskStatusFilter === "ALL" ||
                task.status === taskStatusFilter,
            ).length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Aucune tâche ne correspond à ce filtre dans ce sprint.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedSprint.tasks
                  .filter(
                    (task) =>
                      taskStatusFilter === "ALL" ||
                      task.status === taskStatusFilter,
                  )
                  .map((task) => (
                    <Link
                      key={task.id}
                      href={`/projects/${projectId}/tasks/${task.id}/edit`}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-indigo-300 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-slate-900">
                          {task.type === "BUG" ? "🐞 " : "✓ "}
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {task.type === "BUG" ? "Bug" : "Tâche"}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                        >
                          {STATUS_LABELS[task.status]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  );
}
