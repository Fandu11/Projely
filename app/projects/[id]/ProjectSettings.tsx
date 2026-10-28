
"use client";

import { updateProjectSettings } from "./settings-actions";

type ProjectSettingsProps = {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  isOwner: boolean;
};

export default function ProjectSettings({
  projectId,
  projectName,
  projectDescription,
  isOwner,
}: ProjectSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Informations générales
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Modifie les informations principales de ton projet.
          </p>
        </div>

        {isOwner ? (
          <form
            action={updateProjectSettings.bind(null, projectId)}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nom du projet
              </label>
              <input
                id="project-name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                defaultValue={projectName}
                placeholder="Nom du projet"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description
              </label>
              <textarea
                id="project-description"
                name="description"
                rows={5}
                maxLength={2000}
                defaultValue={projectDescription ?? ""}
                placeholder="Décris l'objectif de ton projet..."
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                2 000 caractères maximum.
              </p>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Nom du projet
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {projectName}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">
                Description
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                {projectDescription || "Aucune description."}
              </p>
            </div>

            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
              Seul le propriétaire du projet peut modifier ces informations.
            </p>
          </div>
        )}
      </section>

      {/* Informations sur les autorisations */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Accès au projet
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {isOwner
            ? "Tu es propriétaire de ce projet. Tu peux modifier ses informations générales."
            : "Tu participes à ce projet en tant que membre. Pour modifier ses informations générales, contacte son propriétaire."}
        </p>
      </section>

      {/* Zone de danger */}
      <section className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-red-700">
          Zone de danger
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          La suppression définitive du projet sera ajoutée séparément,
          avec une confirmation et la gestion des données associées.
        </p>
      </section>
    </div>
  );
}
