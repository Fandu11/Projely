
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const taskTypes = ["EPIC", "STORY", "TASK", "BUG"] as const;
const taskStatuses = ["TODO", "IN_PROGRESS", "TO_REVIEW", "DONE"] as const;
const taskPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type TaskType = (typeof taskTypes)[number];
type TaskStatus = (typeof taskStatuses)[number];
type TaskPriority = (typeof taskPriorities)[number];

function isOneOf<T extends string>(
  value: string,
  values: readonly T[],
): value is T {
  return values.some((item) => item === value);
}

export async function createTask(
  projectId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { id: session.user.id } } },
      ],
    },
    select: {
      id: true,
      ownerId: true,
      members: { select: { id: true } },
    },
  });

  if (!project) {
    redirect("/projects");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawType = String(formData.get("type") ?? "TASK");
  const rawStatus = String(formData.get("status") ?? "TODO");
  const rawPriority = String(formData.get("priority") ?? "MEDIUM");
  const parentTaskId = String(formData.get("parentTaskId") ?? "").trim();
  const sprintId = String(formData.get("sprintId") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();

  if (
    !title ||
    title.length > 150 ||
    description.length > 2000 ||
    !isOneOf(rawType, taskTypes) ||
    !isOneOf(rawStatus, taskStatuses) ||
    !isOneOf(rawPriority, taskPriorities)
  ) {
    redirect(`/projects/${projectId}/tasks/new?error=invalid`);
  }

  const type: TaskType = rawType;
  const status: TaskStatus = rawStatus;
  const priority: TaskPriority = rawPriority;

  // Vérifier le parent et respecter la hiérarchie.
  if (parentTaskId) {
    const parent = await prisma.task.findFirst({
      where: {
        id: parentTaskId,
        projectId,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!parent) {
      redirect(`/projects/${projectId}/tasks/new?error=parent`);
    }

    const validParent =
      (type === "STORY" && parent.type === "EPIC") ||
      ((type === "TASK" || type === "BUG") &&
        (parent.type === "EPIC" || parent.type === "STORY"));

    if (!validParent) {
      redirect(`/projects/${projectId}/tasks/new?error=parent`);
    }
  }

  // Vérifier que le sprint appartient au projet.
  if (sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        projectId,
      },
      select: { id: true },
    });

    if (!sprint) {
      redirect(`/projects/${projectId}/tasks/new?error=sprint`);
    }
  }

  // Le responsable doit être le propriétaire ou un membre du projet.
  if (assigneeId) {
    const isOwner = assigneeId === project.ownerId;
    const isMember = project.members.some(
      (member) => member.id === assigneeId,
    );

    if (!isOwner && !isMember) {
      redirect(`/projects/${projectId}/tasks/new?error=assignee`);
    }
  }

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      type,
      status,
      priority,
      projectId,
      parentTaskId: parentTaskId || null,
      sprintId: sprintId || null,
      assigneeId: assigneeId || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}
