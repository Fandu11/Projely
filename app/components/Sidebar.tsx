
import Link from "next/link";

const navigation = [
  {
    label: "Tableau de bord",
    href: "/",
    icon: "⌂",
  },
  {
    label: "Mes projets",
    href: "/projects",
    icon: "▤",
  },
  {
    label: "Mes tâches",
    href: "/tasks",
    icon: "✓",
  },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-5 text-white">
      {/* Nom de l'application */}
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
