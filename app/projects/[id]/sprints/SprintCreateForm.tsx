
"use client";

import { useActionState } from "react";
import { createSprint } from "../actions";

type Props = {
  projectId: string;
};

export default function SprintCreateForm({ projectId }: Props) {
  const [state, formAction, isPending] = useActionState(
    createSprint.bind(null, projectId),
    {},
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Créer un sprint
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Définis le nom, l'objectif et la période de ton sprint.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
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
            minLength={1}
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
            placeholder="Ex. Terminer l'inscription et la connexion des utilisateurs."
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

        {state.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Création..." : "Créer le sprint"}
          </button>
        </div>
      </form>
    </section>
  );
}
