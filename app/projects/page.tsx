
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const instant = false;

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsFallback />}>
      <ProjectsContent />
    </Suspense>
  );
}

async function ProjectsContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { id: session.user.id } } },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes projets</h1>
          <p className="mt-2 text-sm text-slate-500">
            Organise ton travail et suis l'avancement de tes projets.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <span className="text-lg">+</span>
          Nouveau projet
        </Link>
      </div>

      {projects.length === 0 ? (
        <p>Tu n&apos;as pas encore de projet.</p>
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-400 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {project.name}
                  </h2>
                  <span className="text-indigo-600">→</span>
                </div>

                {project.description && (
                  <p className="mt-2 text-sm text-slate-600">
                    {project.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ProjectsFallback() {
  return (
    <main className="p-8">
      <div className="h-9 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-24 animate-pulse rounded-lg border bg-white" />
    </main>
  );
}
