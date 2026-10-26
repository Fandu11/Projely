
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "ProjectGestion",
  description: "Gérez vos projets simplement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen bg-slate-50">
          <Suspense fallback={<SidebarFallback />}>
            <Sidebar />
          </Suspense>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<NavbarFallback />}>
              <Navbar />
            </Suspense>

            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function NavbarFallback() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="h-10 w-full max-w-xl rounded-lg bg-slate-100" />
      <div className="h-10 w-28 rounded-lg bg-slate-100" />
    </header>
  );
}

function SidebarFallback() {
  return (
    <aside className="min-h-screen w-64 shrink-0 border-r border-slate-800 bg-slate-900 p-5">
      <div className="h-8 w-32 animate-pulse rounded bg-slate-700" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-lg bg-slate-800"
          />
        ))}
      </div>
    </aside>
  );
}
