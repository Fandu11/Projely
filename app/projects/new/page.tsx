
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/lib/auth";
import { createProject } from "../actions";

type NewProjectPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export const instant = false;

export default function NewProjectPage(props: NewProjectPageProps) {
  return (
    <Suspense fallback={<NewProjectFallback />}>
      <NewProjectContent {...props} />
    </Suspense>
  );
}

async function NewProjectContent({
  searchParams,
}: NewProjectPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link
        href="/projects"
        className="text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Retour aux projets
      </Link>

      <div className="mb-8 mt-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Créer un projet
        </h1>
        <p className="mt-2 text-slate-600">
          Donne un nom à ton projet et décris ce que tu souhaites réaliser.
        </p>
      </div>

      {params.error === "invalid" && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          Le nom doit contenir entre 2 et 100 caractères.
          La description ne doit pas dépasser 2 000 caractères.
        </p>
      )}

      <form
        action={createProject}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Nom du projet *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            placeholder="Ex. : Refonte du site web"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={2000}
            placeholder="Objectifs, contexte et résultats attendus..."
            className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            2 000 caractères maximum.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/projects"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Créer le projet
          </button>
        </div>
      </form>
    </main>
  );
}

function NewProjectFallback() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mb-8 mt-6 h-9 w-64 animate-pulse rounded bg-slate-200" />
      <div className="h-[460px] animate-pulse rounded-xl border border-slate-200 bg-white" />
    </main>
  );
}
