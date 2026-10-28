
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  type: string;
  projectId: string;
  projectName: string;
  storyId: string;
  storyTitle: string;
};

type TasksListProps = {
  tasks: Task[];
};

const statusLabels: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TO_REVIEW: "À vérifier",
};

const priorityLabels: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

const statusStyles: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  TO_REVIEW: "bg-amber-100 text-amber-800",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function TasksList({ tasks }: TasksListProps) {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const projects = useMemo(
    () =>
      Array.from(
        new Map(
          tasks.map((task) => [
            task.projectId,
            { id: task.projectId, name: task.projectName },
          ])
        ).values()
      ),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.projectName.toLowerCase().includes(query) ||
        task.storyTitle.toLowerCase().includes(query) ||
        (task.description ?? "").toLowerCase().includes(query);

      const matchesProject =
        projectFilter === "ALL" || task.projectId === projectFilter;

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesProject &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [tasks, search, projectFilter, statusFilter, priorityFilter]);

  const countByStatus = (status: string) =>
    tasks.filter((task) => task.status === status).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            Espace de travail
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Mes tâches
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Toutes les tâches non terminées de tes projets.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-sm text-slate-500">Tâches restantes</p>
          <p className="text-2xl font-bold text-slate-900">
            {tasks.length}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">À faire</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {countByStatus("TODO")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">En cours</p>
          <p className="mt-1 text-2xl font-semibold text-blue-700">
            {countByStatus("IN_PROGRESS")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">À vérifier</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {countByStatus("TO_REVIEW")}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Liste des tâches
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredTasks.length} résultat(s) sur {tasks.length} tâche(s).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une tâche..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            aria-label="Rechercher une tâche"
          />

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            aria-label="Filtrer par projet"
          >
            <option value="ALL">Tous les projets</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            aria-label="Filtrer par statut"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="TO_REVIEW">À vérifier</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            aria-label="Filtrer par priorité"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
            <p className="text-base font-medium text-slate-700">
              Aucune tâche trouvée
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Modifie tes filtres ou profite de ce moment pour souffler.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setProjectFilter("ALL");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
              }}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-slate-50/70"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-slate-900">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-indigo-50 px-2 py-1 font-medium text-indigo-700">
                        {task.projectName}
                      </span>

                      <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                        User story : {task.storyTitle}
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 font-medium ${
                          statusStyles[task.status] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabels[task.status] ?? task.status}
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 font-medium ${
                          priorityStyles[task.priority] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Priorité :{" "}
                        {priorityLabels[task.priority] ?? task.priority}
                      </span>

                      <span className="rounded-md border border-slate-200 px-2 py-1 text-slate-600">
                        {task.type === "BUG" ? "Bug" : "Tâche"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${task.projectId}?tab=tasks`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                  >
                    Voir le projet →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
