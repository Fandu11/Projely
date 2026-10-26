
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <form
        action="/projects"
        method="GET"
        className="flex w-full max-w-xl items-center gap-2"
      >
        <input
          type="search"
          name="q"
          placeholder="Rechercher un projet..."
          aria-label="Rechercher un projet"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Rechercher
        </button>
      </form>

      <Link
        href="/login"
        className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Se connecter
      </Link>
    </header>
  );
}
