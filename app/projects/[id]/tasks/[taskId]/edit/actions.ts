
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const statuses = ["TODO", "IN_PROGRESS", "TO_REVIEW", "DONE"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const types = ["TASK", "BUG", "STORY", "EPIC"] as const;

export async function updateTask(
  projectId: string,
  taskId: string,
  formData: FormData,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

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

  if (!project) redirect("/projects");

  const currentTask = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });

  if (!currentTask) redirect(`/projects/${projectId}`);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");
  const type = String(formData.get("type") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const assignedGroup = String(
    formData.get("assignedGroup") ?? "",
  ).trim();
  const parentTaskId = String(
    formData.get("parentTaskId") ?? "",
  ) || null;

  if (
    title.length < 1 ||
    title.length > 150 ||
    description.length > 2000 ||
    !statuses.includes(status as (typeof statuses)[number]) ||
    !priorities.includes(priority as (typeof priorities)[number]) ||
    !types.includes(type as (typeof types)[number])
  ) {
    redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=invalid`);
  }

  // Une tâche est assignée soit à une personne, soit à un groupe.
  if (assigneeId && assignedGroup) {
    redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=assignment`);
  }

  if (assigneeId) {
    const isMember =
      assigneeId === project.ownerId ||
      project.members.some((member) => member.id === assigneeId);

    if (!isMember) {
      redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=assignee`);
    }
  }

  let parentType: string | null = null;

  if (parentTaskId) {
    if (parentTaskId === taskId) {
      redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=parent`);
    }

    const parent = await prisma.task.findFirst({
      where: { id: parentTaskId, projectId },
      select: { id: true, type: true },
    });

    if (!parent) {
      redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=parent`);
    }

    parentType = parent.type;
  }

  // Empêche les relations hiérarchiques incohérentes.
  if (
    (type === "EPIC" && parentTaskId) ||
    (type === "STORY" && parentType !== null && parentType !== "EPIC") ||
    ((type === "TASK" || type === "BUG") &&
      parentType !== null &&
      parentType !== "STORY" &&
      parentType !== "EPIC")
  ) {
    redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=parent`);
  }

  // Empêche de rattacher un parent à l'un de ses descendants.
  if (parentTaskId) {
    let ancestorId: string | null = parentTaskId;
    const visited = new Set<string>();

    while (ancestorId) {
      if (ancestorId === taskId || visited.has(ancestorId)) {
        redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=parent`);
      }

      visited.add(ancestorId);

      const ancestor: { parentTaskId: string | null } | null =
        await prisma.task.findFirst({
          where: { id: ancestorId, projectId },
          select: { parentTaskId: true },
        });

      ancestorId = ancestor?.parentTaskId ?? null;
    }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description || null,
      status: status as (typeof statuses)[number],
      priority: priority as (typeof priorities)[number],
      type: type as (typeof types)[number],
      assigneeId,
      assignedGroup: assignedGroup || null,
      parentTaskId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks/${taskId}/edit`);

  redirect(`/projects/${projectId}`);
}
