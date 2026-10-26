
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
          <Sidebar />

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
