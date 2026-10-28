
"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  addProjectMember,
  removeProjectMember,
  type MemberActionState,
} from "./actions";

import SprintsSection from "./SprintsSection";

type ProjectMember = {
  id: string;
  name: string | null;
  email: string;
};

type ProjectTabsProps = {
  projectId: string;
  currentUserId: string;
  ownerId: string;
  owner: ProjectMember;
  members: ProjectMember[];
  tasksContent: ReactNode;
  sprints: {
    id: string;
    name: string;
    goal: string | null;
    startDate: string;
    endDate: string;
    status: "PLANNED" | "ACTIVE" | "COMPLETED";
    totalTasks: number;
    completedTasks: number;
  }[];
};

const tabs = [
  { id: "tasks", label: "Tâches" },
  { id: "sprints", label: "Sprints" },
  { id: "calendar", label: "Vue calendrier" },
  { id: "members", label: "Membres" },
  { id: "settings", label: "Paramètres" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const initialMemberState: MemberActionState = {};

export default function ProjectTabs({
  projectId,
  currentUserId,
  ownerId,
  owner,
  members,
  tasksContent,
  sprints,
}: ProjectTabsProps) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tabs.some((item) => item.id === tab)) {
      setActiveTab(tab as TabId);
    } else {
      setActiveTab("tasks");
    }
  }, [searchParams]);

  const allMembers = [
    { ...owner, role: "Propriétaire" },
    ...members
      .filter((member) => member.id !== owner.id)
      .map((member) => ({
        ...member,
        role: "Membre",
      })),
  ];

  const [
    memberState,
    memberFormAction,
    isAddingMember,
  ] = useActionState(
    addProjectMember.bind(null, projectId),
    initialMemberState,
  );

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
            onClick={() => {
              setActiveTab(tab.id);

              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", tab.id);

              router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
              });
            }}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            aria-current={
              activeTab === tab.id ? "page" : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "tasks" && tasksContent}

      {activeTab === "sprints" && (
        <SprintsSection
          projectId={projectId}
          sprints={sprints.map((sprint) => ({
            ...sprint,
            tasks: [],
          }))}
        />
      )}

      {activeTab === "calendar" && (
        <div className="rounded-xl border border-slate-200 p-8 text-center">
          <h2 className="text-lg font-semibold">
            Vue calendrier
          </h2>
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

          {currentUserId === ownerId && (
            <form
              action={memberFormAction}
              className="mb-6 rounded-lg border border-slate-200 p-4"
            >
              <label
                htmlFor="member-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Ajouter un membre par e-mail
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="member-email"
                  name="email"
                  type="email"
                  required
                  placeholder="exemple@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAddingMember
                    ? "Ajout..."
                    : "Ajouter"}
                </button>
              </div>

              {memberState.error && (
                <p
                  role="alert"
                  className="mt-3 text-sm text-red-600"
                >
                  {memberState.error}
                </p>
              )}

              {memberState.success && (
                <p
                  role="status"
                  className="mt-3 text-sm text-green-700"
                >
                  {memberState.success}
                </p>
              )}
            </form>
          )}

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

                {currentUserId === ownerId &&
                  member.id !== ownerId && (
                    <form
                      action={removeProjectMember.bind(
                        null,
                        projectId,
                      )}
                      onSubmit={(event) => {
                        const confirmed = window.confirm(
                          `Retirer ${
                            member.name || member.email
                          } de ce projet ?`,
                        );

                        if (!confirmed) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input
                        type="hidden"
                        name="memberId"
                        value={member.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Retirer
                      </button>
                    </form>
                  )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "settings" && (
        <div className="rounded-xl border border-slate-200 p-8 text-center">
          <h2 className="text-lg font-semibold">
            Paramètres du projet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Les paramètres du projet seront disponibles ici.
          </p>
        </div>
      )}
    </div>
  );
}
