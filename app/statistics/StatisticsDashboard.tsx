
"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type ProjectStatistics = {
  id: string;
  name: string;
  totalTasks: number;
  completed: number;
  todo: number;
  inProgress: number;
  toReview: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
  totalSprints: number;
  activeSprints: number;
  completedSprints: number;
  plannedSprints: number;
  progress: number;
};

type Totals = {
  tasks: number;
  completed: number;
  todo: number;
  inProgress: number;
  toReview: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
  sprints: number;
  activeSprints: number;
  completedSprints: number;
  plannedSprints: number;
  projects: number;
  overallProgress: number;
};

type Props = {
  projects: ProjectStatistics[];
  totals: Totals;
};

const STATUS_COLORS = {
  todo: "#94a3b8",
  inProgress: "#3b82f6",
  toReview: "#f59e0b",
  completed: "#10b981",
};

function StatCard({
  label,
  value,
  detail,
  icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  iconClass: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-semibold ${iconClass}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function PipelineBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">
          {value}{" "}
          <span className="font-normal text-slate-400">
            ({Math.round(percentage)}%)
          </span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function CompletionDonut({
  completed,
  total,
  percentage,
}: {
  completed: number;
  total: number;
  percentage: number;
}) {
  const remaining = Math.max(0, total - completed);
  const style = {
    background: `conic-gradient(#10b981 0% ${percentage}%, #e2e8f0 ${percentage}% 100%)`,
  } satisfies CSSProperties;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
      <div
        className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
        style={style}
        role="img"
        aria-label={`${percentage}% des tâches terminées`}
      >
        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-3xl font-bold text-slate-900">
            {percentage}%
          </span>
          <span className="mt-1 text-xs text-slate-500">terminées</span>
        </div>
      </div>

      <div className="w-full space-y-4 sm:max-w-48">
        <LegendItem
          color="#10b981"
          label="Terminées"
          value={completed}
        />
        <LegendItem
          color="#e2e8f0"
          label="Restantes"
          value={remaining}
        />
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">Total des tâches</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
        </div>
      </div>
    </div>
  );
}

function ProjectProgressChart({
  projects,
}: {
  projects: ProjectStatistics[];
}) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aucun projet à afficher pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((project) => {
        const remaining = Math.max(
          0,
          project.totalTasks - project.completed
        );

        const completedWidth =
          project.totalTasks > 0
            ? (project.completed / project.totalTasks) * 100
            : 0;

        return (
          <div key={project.id} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/projects/${project.id}`}
                className="font-medium text-slate-800 hover:text-indigo-700"
              >
                {project.name}
              </Link>
              <span className="text-sm text-slate-500">
                {project.completed}/{project.totalTasks} tâche(s) ·{" "}
                {project.progress}%
              </span>
            </div>

            <div
              className="flex h-4 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`${project.name} : ${project.completed} tâches terminées et ${remaining} restantes`}
            >
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completedWidth}%` }}
              />
              <div
                className="h-full bg-slate-200"
                style={{ width: `${100 - completedWidth}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4">
        <LegendItem color="#10b981" label="Terminées" value={0} />
        <LegendItem color="#e2e8f0" label="Restantes" value={0} />
      </div>
      <p className="text-xs text-slate-400">
        Les nombres exacts sont affichés sur chaque ligne.
      </p>
    </div>
  );
}

export default function StatisticsDashboard({ projects, totals }: Props) {
  const completion = totals.tasks > 0
    ? Math.round((totals.completed / totals.tasks) * 100)
    : 0;

  const priorityTotal =
    totals.urgent + totals.high + totals.medium + totals.low;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            ANALYSE DE PERFORMANCE
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Statistiques
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Visualise l'avancement, le pipeline et les priorités de tes projets.
          </p>
        </div>

        <Link
          href="/tasks"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Voir les tâches <span aria-hidden="true">→</span>
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Projets"
          value={totals.projects}
          detail="Projets accessibles à ton compte"
          icon="▤"
          iconClass="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="Tâches terminées"
          value={totals.completed}
          detail={`Sur ${totals.tasks} tâches au total`}
          icon="✓"
          iconClass="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Taux d'achèvement"
          value={`${completion}%`}
          detail={`${Math.max(0, totals.tasks - totals.completed)} tâche(s) restante(s)`}
          icon="↗"
          iconClass="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Sprints actifs"
          value={totals.activeSprints}
          detail={`${totals.sprints} sprint(s) au total`}
          icon="◷"
          iconClass="bg-violet-50 text-violet-700"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Pipeline des tâches"
          subtitle="Répartition des tâches par étape du workflow."
        >
          <div className="space-y-6">
            <PipelineBar
              label="À faire"
              value={totals.todo}
              total={totals.tasks}
              color={STATUS_COLORS.todo}
            />
            <PipelineBar
              label="En cours"
              value={totals.inProgress}
              total={totals.tasks}
              color={STATUS_COLORS.inProgress}
            />
            <PipelineBar
              label="À vérifier"
              value={totals.toReview}
              total={totals.tasks}
              color={STATUS_COLORS.toReview}
            />
            <PipelineBar
              label="Terminées"
              value={totals.completed}
              total={totals.tasks}
              color={STATUS_COLORS.completed}
            />
          </div>

          <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            Chaque barre indique la part de cette catégorie dans l'ensemble
            des tâches. Les catégories dépendent des statuts configurés dans
            ton application.
          </p>
        </Panel>

        <Panel
          title="Tâches rendues / total"
          subtitle="Part des tâches achevées parmi toutes les tâches."
        >
          <CompletionDonut
            completed={totals.completed}
            total={totals.tasks}
            percentage={completion}
          />
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Progression par projet"
          subtitle="Compare le volume de tâches terminées et restantes."
        >
          <ProjectProgressChart projects={projects} />
        </Panel>

        <Panel
          title="Répartition des priorités"
          subtitle="Nombre de tâches par niveau de priorité."
        >
          <div className="space-y-5">
            <PipelineBar
              label="Urgente"
              value={totals.urgent}
              total={priorityTotal}
              color="#ef4444"
            />
            <PipelineBar
              label="Haute"
              value={totals.high}
              total={priorityTotal}
              color="#f97316"
            />
            <PipelineBar
              label="Moyenne"
              value={totals.medium}
              total={priorityTotal}
              color="#3b82f6"
            />
            <PipelineBar
              label="Basse"
              value={totals.low}
              total={priorityTotal}
              color="#94a3b8"
            />
          </div>
          <p className="mt-5 text-xs text-slate-400">
            {priorityTotal} tâche(s) avec une priorité reconnue.
          </p>
        </Panel>
      </section>

      <Panel
        title="Statistiques des sprints"
        subtitle="Répartition des sprints par statut."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">Actifs</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {totals.activeSprints}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">Terminés</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {totals.completedSprints}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-700">Planifiés</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">
              {totals.plannedSprints}
            </p>
          </div>
        </div>
      </Panel>

      <footer className="text-center text-xs text-slate-400">
        Données calculées à partir des projets et tâches accessibles à ton compte.
      </footer>
    </main>
  );
}
