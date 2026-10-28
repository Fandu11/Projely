
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CalendarTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

type CalendarEvent = {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: string;
  projectId: string;
  projectName: string;
  tasks: CalendarTask[];
};

type Props = {
  events: CalendarEvent[];
};

const statusLabels: Record<string, string> = {
  PLANNED: "Planifié",
  ACTIVE: "En cours",
  COMPLETED: "Terminé",
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

const priorityLabels: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  return new Date(value);
}

function formatDate(value: string) {
  return parseDate(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function GlobalCalendar({ events }: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const numberOfDays = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((mondayOffset + numberOfDays) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const day = new Date(year, month, index - mondayOffset + 1);

      return {
        date: day,
        key: dateKey(day),
        inCurrentMonth: day.getMonth() === month,
      };
    });
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const result = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const start = parseDate(event.startDate);
      const end = parseDate(event.endDate);

      const day = new Date(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate(),
      );

      const lastDay = new Date(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate(),
      );

      if (lastDay < day) continue;

      while (day <= lastDay) {
        const key = dateKey(day);
        const dayEvents = result.get(key) ?? [];

        dayEvents.push(event);
        result.set(key, dayEvents);

        day.setDate(day.getDate() + 1);
      }
    }

    return result;
  }, [events]);

  const selectedEvents = eventsByDay.get(selectedDate) ?? [];

  const monthLabel = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(offset: number) {
    setCurrentDate(new Date(year, month + offset, 1));
  }

  function goToToday() {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(dateKey(today));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold capitalize text-slate-900">
              {monthLabel}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {events.length} sprint{events.length > 1 ? "s" : ""} au total
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Mois précédent"
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Mois suivant"
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 pb-3">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-500 sm:text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map(({ date, key, inCurrentMonth }) => {
            const dayEvents = eventsByDay.get(key) ?? [];
            const isSelected = selectedDate === key;
            const isToday = dateKey(new Date()) === key;

            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDate(key)}
                aria-pressed={isSelected}
                className={`min-h-20 min-w-0 border-b border-r border-slate-100 p-1 text-left transition sm:min-h-28 sm:p-2 ${
                  isSelected
                    ? "bg-indigo-50 ring-2 ring-inset ring-indigo-500"
                    : "hover:bg-slate-50"
                } ${!inCurrentMonth ? "bg-slate-50/70" : ""}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs sm:text-sm ${
                    isToday
                      ? "bg-indigo-600 font-semibold text-white"
                      : inCurrentMonth
                        ? "text-slate-800"
                        : "text-slate-400"
                  }`}
                >
                  {date.getDate()}
                </span>

                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      title={`${event.projectName} — ${event.name}`}
                      className="truncate rounded bg-indigo-100 px-1 py-1 text-[10px] font-medium text-indigo-800 sm:text-xs"
                    >
                      {event.name}
                    </div>
                  ))}

                  {dayEvents.length > 2 && (
                    <p className="px-1 text-[10px] text-slate-500 sm:text-xs">
                      +{dayEvents.length - 2} autres
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-indigo-100" />
            Période d'un sprint
          </span>
          <span>Choisis une journée pour voir les détails.</span>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {formatDate(`${selectedDate}T12:00:00.000Z`)}
        </h2>

        {selectedEvents.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            Aucun sprint prévu ce jour-là.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {selectedEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-indigo-600">
                      {event.projectName}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">
                      {event.name}
                    </h3>
                    {event.goal && (
                      <p className="mt-1 text-sm text-slate-500">
                        {event.goal}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {statusLabels[event.status] ?? event.status}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Du {formatDate(event.startDate)} au{" "}
                  {formatDate(event.endDate)}
                </p>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Tâches associées ({event.tasks.length})
                  </p>

                  {event.tasks.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Aucune tâche associée à ce sprint.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {event.tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <span className="text-sm text-slate-700">
                            {task.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              priorityColors[task.priority] ??
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {priorityLabels[task.priority] ??
                              task.priority}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link
                  href={`/projects/${event.projectId}?tab=calendar`}
                  className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Ouvrir le projet →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
