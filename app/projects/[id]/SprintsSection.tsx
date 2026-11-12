
"use client";

import { useActionState, useState } from "react";
import { createSprint } from "./actions";

type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

type SprintStory = {
  id: string;
  title: string;
  epicName: string | null;
  taskCount: number;
  completedTaskCount: number;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

type SprintData = {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  totalStories: number;
  completedStories: number;
  stories: SprintStory[];
};

type SprintFormState = {
  error?: string;
  success?: string;
};

type SprintsSectionProps = {
  projectId: string;
  sprints: SprintData[];
};

const sprintStatusLabels: Record<SprintStatus, string> = {
  PLANNED: "Planifié",
  ACTIVE: "En cours",
  COMPLETED: "Terminé",
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StoryList({ stories }: { stories: SprintStory[] }) {
  if (stories.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">
        Aucune story associée à ce sprint pour le moment.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {stories.map((story) => (
        <li key={story.id} className="rounded-lg border border-gray-200 p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-gray-900">{story.title}</p>
              {story.epicName && (
                <p className="text-xs text-gray-500">
                  Epic : {story.epicName}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-600">
              {story.completedTaskCount}/{story.taskCount} tâches terminées
            </span>
          </div>
        </li>
      ))}
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
            Organise les stories du projet en cycles de travail.
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
            Crée ton premier sprint pour organiser les stories du projet.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sprints.map((sprint) => {
            const progress =
              sprint.totalStories > 0
                ? Math.round(
                    (sprint.completedStories / sprint.totalStories) * 100,
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
                      {sprint.completedStories}/{sprint.totalStories} stories ·{" "}
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
                    Stories du sprint
                  </h4>

                  <StoryList stories={sprint.stories} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
