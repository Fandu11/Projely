
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const navigation = [
  { label: "Accueil", href: "/", icon: "⌂" },
  { label: "Mes tâches", href: "/tasks", icon: "✓" },
  { label: "Équipe", href: "/teams", icon: "👥" },
  { label: "Notifications", href: "/notifications", icon: "🔔" },
  { label: "Calendrier", href: "/calendar", icon: "📅" },
  { label: "Statistiques", href: "/statistics", icon: "📊" },
  { label: "Mes projets", href: "/projects", icon: "▤" },
];

export default async function Sidebar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const projects = session?.user
    ? await prisma.project.findMany({
        where: {
          members: {
            some: {
              id: session.user.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      })
    : [];

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-5 text-white">
      <Link href="/" className="mb-8 text-2xl font-bold">
        Project<span className="text-indigo-400">Ly</span>
      </Link>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Menu principal
      </p>

      <nav className="flex flex-col gap-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Projets
          </p>

          <Link
            href="/projects/new"
            title="Voir tous les projets"
            className="rounded px-2 text-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            +
          </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              title={project.name}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <span className="text-indigo-400">▤</span>
              <span className="truncate">{project.name}</span>
            </Link>
          ))}

          {session?.user && projects.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-500">
              Aucun projet pour le moment.
            </p>
          )}

          {!session?.user && (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Connectez-vous pour voir vos projets
            </Link>
          )}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-800 pt-4">
        <Link
          href="/settings"
          className="block rounded-lg px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          ⚙ Paramètres
        </Link>
      </div>
    </aside>
  );
}
