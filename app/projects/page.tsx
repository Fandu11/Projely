
import { headers } from "next/headers";
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
      ownerId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Mes projets
      </h1>

      {projects.length === 0 ? (
        <p>Tu n&apos;as pas encore de projet.</p>
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-lg border p-4"
            >
              <h2 className="text-xl font-semibold">
                {project.name}
              </h2>

              {project.description && (
                <p className="mt-2 text-gray-600">
                  {project.description}
                </p>
              )}
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
