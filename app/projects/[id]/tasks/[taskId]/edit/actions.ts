
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const statuses = ["TODO", "IN_PROGRESS", "TO_REVIEW", "DONE"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const types = ["TASK", "BUG"] as const;

type TaskStatus = (typeof statuses)[number];
type TaskPriority = (typeof priorities)[number];
type TaskType = (typeof types)[number];

function redirectWithError(
  projectId: string,
  taskId: string,
  error: string,
): never {
  redirect(`/projects/${projectId}/tasks/${taskId}/edit?error=${error}`);
}

function getValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateTask(
  projectId: string,
  taskId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Vérifier que l'utilisateur a accès au projet.
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { id: userId } } },
      ],
    },
    select: {
      id: true,
      ownerId: true,
      members: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!project) {
    redirect("/projects");
  }

  // Vérifier que la tâche appartient bien à ce projet.
  const currentTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId: project.id,
    },
    select: {
      id: true,
    },
  });

  if (!currentTask) {
    redirect(`/projects/${projectId}`);
  }

  const title = getValue(formData, "title");
  const description = getValue(formData, "description");
  const status = getValue(formData, "status");
  const priority = getValue(formData, "priority");
  const type = getValue(formData, "type");
  const storyId = getValue(formData, "storyId") || null;
  const sprintId = getValue(formData, "sprintId") || null;
  const assigneeId = getValue(formData, "assigneeId") || null;

  // Vérifier les champs avant toute modification.
  if (
    title.length < 1 ||
    title.length > 150 ||
    description.length > 2000 ||
    !statuses.includes(status as TaskStatus) ||
    !priorities.includes(priority as TaskPriority) ||
    !types.includes(type as TaskType)
  ) {
    redirectWithError(project.id, taskId, "invalid");
  }

  // Une Story doit appartenir au même projet.
  if (storyId) {
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        projectId: project.id,
      },
      select: {
        id: true,
      },
    });

    if (!story) {
      redirectWithError(project.id, taskId, "story");
    }
  }

  // Un Sprint doit appartenir au même projet.
  if (sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        projectId: project.id,
      },
      select: {
        id: true,
      },
    });

    if (!sprint) {
      redirectWithError(project.id, taskId, "sprint");
    }
  }

  // L'assigné doit être le propriétaire ou un membre du projet.
  if (assigneeId) {
    const isMember =
      assigneeId === project.ownerId ||
      project.members.some((member) => member.id === assigneeId);

    if (!isMember) {
      redirectWithError(project.id, taskId, "assignee");
    }
  }

  await prisma.task.update({
    where: {
      id: currentTask.id,
    },
    data: {
      title,
      description: description || null,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      type: type as TaskType,
      storyId,
      sprintId,
      assigneeId,
    },
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/projects/${project.id}/tasks/${taskId}/edit`);
  revalidatePath(`/projects/${project.id}/sprints`);

  redirect(`/projects/${project.id}`);
}
