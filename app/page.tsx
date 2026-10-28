
export const instant = false;

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const statusLabels: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  TO_REVIEW: "À vérifier",
  DONE: "Terminée",
  COMPLETED: "Terminée",
};

const priorityLabels: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function isFinished(status: string) {
  return ["DONE", "COMPLETED"].includes(status.toUpperCase());
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: { id: session.user.id },
          },
        },
      ],
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      sprints: {
        select: {
          id: true,
          name: true,
          goal: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
      epics: {
        select: {
          stories: {
            select: {
              id: true,
              title: true,
              tasks: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  status: true,
                  priority: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const allTasks = projects.flatMap((project) =>
    project.epics.flatMap((epic) =>
      epic.stories.flatMap((story) =>
        story.tasks.map((task) => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          storyTitle: story.title,
        }))
      )
    )
  );

  const unfinishedTasks = allTasks.filter(
    (task) => !isFinished(task.status)
  );

  const urgentTasks = unfinishedTasks
    .filter((task) =>
      ["URGENT", "HIGH"].includes(task.priority.toUpperCase())
    )
    .slice(0, 5);

  const activeSprints = projects
    .flatMap((project) =>
      project.sprints.map((sprint) => ({
        ...sprint,
        projectId: project.id,
        projectName: project.name,
      }))
    )
    .filter((sprint) => {
      const status = sprint.status.toUpperCase();
      return ["ACTIVE", "IN_PROGRESS", "ONGOING"].includes(status);
    })
    .sort(
      (a, b) =>
        a.endDate.getTime() - b.endDate.getTime()
    )
    .slice(0, 4);

  const recentProjects = projects.slice(0, 4);

  const completedTasks = allTasks.filter((task) =>
    isFinished(task.status)
  ).length;

  const progress =
    allTasks.length > 0
      ? Math.round((completedTasks / allTasks.length) * 100)
      : 0;

  const firstName = session.user.name?.trim().split(/\s+/)[0] || "toi";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
      {/* En-tête */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-lg md:p-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-200">
              TON ESPACE DE TRAVAIL
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Bonjour {firstName} 👋
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 md:text-base">
              Voici où en sont tes projets. Consulte tes tâches en cours
              et garde le cap sur tes objectifs.
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Voir mes projets
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Indicateurs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mes projets"
          value={projects.length}
          detail="Projets accessibles"
          icon="▤"
          iconStyle="bg-indigo-50 text-indigo-700"
        />

        <StatCard
          label="Tâches restantes"
          value={unfinishedTasks.length}
          detail="Toutes les tâches non terminées"
          icon="✓"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <StatCard
          label="Prioritaires"
          value={urgentTasks.length}
          detail="Urgentes ou importantes, affichées ci-dessous"
          icon="!"
          iconStyle="bg-orange-50 text-orange-700"
        />

        <StatCard
          label="Progression globale"
          value={`${progress}%`}
          detail={`${completedTasks} tâche(s) terminée(s)`}
          icon="↗"
          iconStyle="bg-emerald-50 text-emerald-700"
        />
      </section>

      {/* Projets et tâches prioritaires */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionHeading
            title="Mes projets"
            subtitle="Retrouve rapidement tes espaces de travail."
            href="/projects"
            linkLabel="Tous les projets"
          />

          {recentProjects.length === 0 ? (
            <EmptyState
              title="Aucun projet pour le moment"
              description="Tes projets apparaîtront ici dès que tu en auras accès."
              href="/projects"
              linkLabel="Découvrir les projets"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recentProjects.map((project) => {
                const projectTasks = project.epics.flatMap((epic) =>
                  epic.stories.flatMap((story) => story.tasks)
                );

                const remaining = projectTasks.filter(
                  (task) => !isFinished(task.status)
                ).length;

                const done = projectTasks.filter((task) =>
                  isFinished(task.status)
                ).length;

                const projectProgress =
                  projectTasks.length > 0
                    ? Math.round((done / projectTasks.length) * 100)
                    : 0;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-700">
                        ▤
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">
                          {project.description || "Aucune description"}
                        </p>
                      </div>

                      <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">
                        →
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {remaining} tâche(s) restante(s)
                      </span>
                      <span className="font-semibold text-slate-700">
                        {projectProgress}%
                      </span>
                    </div>

                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`Progression de ${project.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={projectProgress}
                    >
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${projectProgress}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionHeading
            title="À traiter en priorité"
            subtitle="Tes tâches urgentes et importantes."
            href="/tasks"
            linkLabel="Toutes les tâches"
          />

          <div className="space-y-3">
            {urgentTasks.length === 0 ? (
              <EmptyState
                title="Tout est sous contrôle"
                description="Aucune tâche urgente ou importante parmi les tâches restantes."
                href="/tasks"
                linkLabel="Voir mes tâches"
              />
            ) : (
              urgentTasks.map((task) => (
                <article
                  key={`${task.projectId}-${task.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <h3 className="font-medium text-slate-900">
                    {task.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {task.projectName}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        priorityStyles[task.priority] ??
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {priorityLabels[task.priority] ?? task.priority}
                    </span>

                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {statusLabels[task.status] ?? task.status}
                    </span>
                  </div>

                  <Link
                    href={`/projects/${task.projectId}?tab=tasks`}
                    className="mt-3 inline-flex text-sm font-medium text-indigo-700 hover:text-indigo-900"
                  >
                    Ouvrir le projet →
                  </Link>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Sprints en cours */}
      <section className="space-y-4">
        <SectionHeading
          title="Sprints en cours"
          subtitle="Les cycles de travail actifs de tes projets."
          href="/calendar"
          linkLabel="Ouvrir le calendrier"
        />

        {activeSprints.length === 0 ? (
          <EmptyState
            title="Aucun sprint en cours"
            description="Lorsqu'un sprint sera actif, tu le retrouveras dans cette section."
            href="/calendar"
            linkLabel="Consulter le calendrier"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {activeSprints.map((sprint) => (
              <article
                key={`${sprint.projectId}-${sprint.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  En cours
                </span>

                <h3 className="mt-3 font-semibold text-slate-900">
                  {sprint.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {sprint.projectName}
                </p>

                {sprint.goal && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                    {sprint.goal}
                  </p>
                )}

                <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <p>Début : {formatDate(sprint.startDate)}</p>
                  <p>Fin : {formatDate(sprint.endDate)}</p>
                </div>

                <Link
                  href={`/projects/${sprint.projectId}?tab=calendar`}
                  className="mt-4 inline-flex text-sm font-medium text-indigo-700 hover:text-indigo-900"
                >
                  Voir le sprint →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Raccourcis */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Accès rapides
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickLink
            href="/projects"
            icon="▤"
            title="Projets"
            description="Consulter tes projets et leurs détails."
          />

          <QuickLink
            href="/tasks"
            icon="✓"
            title="Mes tâches"
            description="Retrouver toutes les tâches restantes."
          />

          <QuickLink
            href="/calendar"
            icon="▦"
            title="Calendrier"
            description="Visualiser les sprints de tes projets."
          />
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  iconStyle,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  iconStyle: string;
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
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-semibold ${iconStyle}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <Link
        href={href}
        className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <Link
        href={href}
        className="mt-4 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-700">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-indigo-700">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
