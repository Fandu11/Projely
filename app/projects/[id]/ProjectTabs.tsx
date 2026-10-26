
"use client";

import { useState } from "react";

type ProjectMember = {
  id: string;
  name: string | null;
  email: string;
};

type ProjectTabsProps = {
  owner: ProjectMember;
  members: ProjectMember[];
  tasksContent: React.ReactNode;
};

const tabs = [
  { id: "tasks", label: "Tâches" },
  { id: "calendar", label: "Vue calendrier" },
  { id: "members", label: "Membres" },
  { id: "settings", label: "Paramètres" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ProjectTabs({
  owner,
  members,
  tasksContent,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  const allMembers = [
    { ...owner, role: "Propriétaire" },
    ...members
      .filter((member) => member.id !== owner.id)
      .map((member) => ({ ...member, role: "Membre" })),
  ];

  return (
    <div>
      <nav
        className="mb-6 flex gap-6 overflow-x-auto border-b border-slate-200"
        aria-label="Sections du projet"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "tasks" && tasksContent}

      {activeTab === "calendar" && (
        <div className="rounded-xl border border-slate-200 p-8 text-center">
          <h2 className="text-lg font-semibold">Vue calendrier</h2>
          <p className="mt-2 text-sm text-slate-500">
            La vue calendrier sera disponible ici.
          </p>
        </div>
      )}

      {activeTab === "members" && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Membres du projet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {allMembers.length} personne(s) dans ce projet
            </p>
          </div>

          {allMembers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun membre dans ce projet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {allMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 py-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                    {(member.name || member.email)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {member.name || "Sans nom"}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {member.email}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "settings" && (
        <div className="rounded-xl border border-slate-200 p-8 text-center">
          <h2 className="text-lg font-semibold">Paramètres du projet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Les paramètres du projet seront disponibles ici.
          </p>
        </div>
      )}
    </div>
  );
}
