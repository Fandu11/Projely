
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { createTask } from "./actions";

const columns = [
  { status: "TODO", title: "À faire", color: "border-slate-400" },
  { status: "IN_PROGRESS", title: "En cours", color: "border-blue-500" },
  { status: "TO_REVIEW", title: "À revoir", color: "border-amber-500" },
  { status: "DONE", title: "Fini", color: "border-emerald-500" },
] as const;

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const instant = false;

export default function ProjectPage(props: ProjectPageProps) {
  return (
    <Suspense fallback={<ProjectFallback />}>
      <ProjectContent {...props} />
    </Suspense>
  );
}

async function ProjectContent({
  params,
  searchParams,
}: ProjectPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { id: session.user.id } } },
      ],
    },
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="min-w-0 p-6 md:p-8">
      <Link
        href="/projects"
        className="text-sm text-slate-500 hover:text-indigo-600"
      >
        ← Retour à mes projets
      </Link>

      <header className="mb-8 mt-5">
        <h1 className="text-3xl font-bold text-slate-900">
          {project.name}
        </h1>

        {project.description && (
          <p className="mt-2 max-w-3xl text-slate-600">
            {project.description}
          </p>
        )}

        <p className="mt-3 text-sm text-slate-500">
          {project.tasks.length} tâche(s)
        </p>
      </header>

      {query.error === "invalid" && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Vérifie le titre, la description et le statut de la tâche.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map((column) => {
          const tasks = project.tasks.filter(
            (task) => task.status === column.status,
          );

          return (
            <section
              key={column.status}
              className="min-w-0 rounded-xl bg-slate-100 p-3"
            >
              <div
                className={`mb-4 flex items-center justify-between border-t-4 ${column.color} pt-3`}
              >
                <h2 className="font-semibold text-slate-800">
                  {column.title}
                </h2>
                <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">
                  {tasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <h3 className="font-medium text-slate-900">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {task.description}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                      Créée le{" "}
                      {task.createdAt.toLocaleDateString("fr-FR")}
                    </p>
                  </article>
                ))}

                <form
                  action={createTask.bind(null, project.id)}
                  className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-white/70 p-3"
                >
                  <input
                    type="hidden"
                    name="status"
                    value={column.status}
                  />

                  <input
                    name="title"
                    required
                    maxLength={150}
                    placeholder="Nom de la tâche..."
                    aria-label={`Nouvelle tâche : ${column.title}`}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />

                  <textarea
                    name="description"
                    maxLength={2000}
                    rows={2}
                    placeholder="Description (facultative)"
                    aria-label="Description de la tâche"
                    className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                  >
                    + Ajouter une tâche
                  </button>
                </form>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function ProjectFallback() {
  return (
    <main className="min-w-0 p-6 md:p-8">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 h-9 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    </main>
  );
}
