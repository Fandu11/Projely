
"use client";

import { useState, useActionState } from "react";
import { createSprint } from "./actions";

type SprintData = {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  totalTasks: number;
  completedTasks: number;
};

type Props = {
  projectId: string;
  sprints: SprintData[];
};

const statusLabels = {
  PLANNED: "À venir",
  ACTIVE: "En cours",
  COMPLETED: "Terminé",
} as const;

const statusColors = {
  PLANNED: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
} as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SprintsSection({ projectId, sprints }: Props) {
  const [showForm, setShowForm] = useState(false);

  const [state, formAction, isPending] = useActionState(
    createSprint.bind(null, projectId),
    {},
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Sprints du projet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organise les tâches en périodes de travail et suis leur progression.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {showForm ? "Fermer le formulaire" : "+ Nouveau sprint"}
        </button>
      </div>

      {showForm && (
        <form
          action={formAction}
          className="rounded-xl border border-slate-200 bg-white p-5 md:p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Créer un sprint
          </h3>

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="sprint-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Nom du sprint *
              </label>
              <input
                id="sprint-name"
                name="name"
                required
                maxLength={100}
                placeholder="Ex. Sprint 1 — Authentification"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="sprint-goal"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Objectif
              </label>
              <textarea
                id="sprint-goal"
                name="goal"
                rows={3}
                maxLength={1000}
                placeholder="Quel est l'objectif de ce sprint ?"
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="sprint-start"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Date de début *
                </label>
                <input
                  id="sprint-start"
                  name="startDate"
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="sprint-end"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Date de fin *
                </label>
                <input
                  id="sprint-end"
                  name="endDate"
                  type="date"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {state.error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {state.error}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Création..." : "Créer le sprint"}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Liste des sprints</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
          {sprints.length}
        </span>
      </div>

      {sprints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <h3 className="font-semibold text-slate-800">
            Aucun sprint pour le moment
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Clique sur « Nouveau sprint » pour planifier ton premier sprint.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {sprints.map((sprint) => {
            const progress =
              sprint.totalTasks === 0
                ? 0
                : Math.round(
                    (sprint.completedTasks / sprint.totalTasks) * 100,
                  );

            return (
              <article
                key={sprint.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="break-words text-lg font-semibold text-slate-900">
                    {sprint.name}
                  </h4>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[sprint.status]}`}
                  >
                    {statusLabels[sprint.status]}
                  </span>
                </div>

                {sprint.goal && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {sprint.goal}
                  </p>
                )}

                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Période
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-slate-600">Tâches terminées</span>
                    <span className="font-medium text-slate-900">
                      {sprint.completedTasks}/{sprint.totalTasks}
                    </span>
                  </div>

                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
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

                  <p className="mt-1 text-right text-xs text-slate-500">
                    {progress} %
                  </p>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  {sprint.totalTasks} tâche
                  {sprint.totalTasks > 1 ? "s" : ""}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
