
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import SprintCreateForm from "./SprintCreateForm";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
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

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SprintsPage(props: PageProps) {
  return (
    <Suspense fallback={<SprintsFallback />}>
      <SprintsContent {...props} />
    </Suspense>
  );
}

async function SprintsContent({ params }: PageProps) {
  const { id: projectId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { id: session.user.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
      sprints: {
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        include: {
          _count: { select: { tasks: true } },
          tasks: {
            select: { status: true },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="min-w-0 p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-slate-500 hover:text-blue-600"
        >
          ← Retour au projet
        </Link>

        <div className="mt-4">
          <p className="text-sm text-slate-500">{project.name}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Sprints
          </h1>
          <p className="mt-2 text-slate-600">
            Planifie le travail et suis l&apos;avancement de tes tâches.
          </p>
        </div>
      </div>

      <SprintCreateForm projectId={project.id} />

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Mes sprints
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            {project.sprints.length}
          </span>
        </div>

        {project.sprints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <h3 className="font-semibold text-slate-800">
              Aucun sprint pour le moment
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Utilise le formulaire ci-dessus pour créer ton premier sprint.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {project.sprints.map((sprint) => {
              const completedTasks = sprint.tasks.filter(
                (task) => task.status === "DONE",
              ).length;

              const totalTasks = sprint._count.tasks;
              const progress =
                totalTasks === 0
                  ? 0
                  : Math.round((completedTasks / totalTasks) * 100);

              return (
                <article
                  key={sprint.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="break-words text-lg font-semibold text-slate-900">
                      {sprint.name}
                    </h3>

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
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Tâches terminées
                      </span>
                      <span className="font-medium text-slate-900">
                        {completedTasks}/{totalTasks}
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
                    {totalTasks} tâche{totalTasks > 1 ? "s" : ""}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function SprintsFallback() {
  return (
    <main className="min-w-0 p-6 md:p-8">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-10 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </main>
  );
}
