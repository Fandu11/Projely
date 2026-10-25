
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar/Sidebar";
import Navbar from "./components/Navbar/Navbar";

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
            <Navbar />

            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
