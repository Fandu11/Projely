
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const elementTypes = ["EPIC", "STORY", "TASK", "BUG"] as const;
const statuses = ["TODO", "IN_PROGRESS", "TO_REVIEW", "DONE"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type ElementType = (typeof elementTypes)[number];
type TaskStatus = (typeof statuses)[number];
type TaskPriority = (typeof priorities)[number];

function redirectWithError(projectId: string, error: string): never {
  redirect(`/projects/${projectId}/tasks/new?error=${error}`);
}

function getFormValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createProjectElement(
  projectId: string,
  formData: FormData,
): Promise<void> {
  // 1. Authentification
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 2. Vérification de l'accès au projet
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
    },
  });

  if (!project) {
    redirect("/projects");
  }

  // 3. Lecture et validation des champs communs
  const rawType = getFormValue(formData, "type");
  const title = getFormValue(formData, "title");
  const description = getFormValue(formData, "description") || null;
  const parentId = getFormValue(formData, "parentId");

  if (
    !elementTypes.includes(rawType as ElementType) ||
    title.length === 0 ||
    title.length > 200 ||
    (description !== null && description.length > 5000)
  ) {
    redirectWithError(project.id, "invalid");
  }

  const type = rawType as ElementType;

  const rawStatus = getFormValue(formData, "status") || "TODO";
  const rawPriority = getFormValue(formData, "priority") || "MEDIUM";
  const sprintId = getFormValue(formData, "sprintId");
  const assigneeId = getFormValue(formData, "assigneeId");

  const isTaskOrBug = type === "TASK" || type === "BUG";

  // 4. Les champs de tâche ne s'appliquent qu'aux Tasks et aux Bugs
  if (
    isTaskOrBug &&
    (!statuses.includes(rawStatus as TaskStatus) ||
      !priorities.includes(rawPriority as TaskPriority))
  ) {
    redirectWithError(project.id, "invalid");
  }

  if (!isTaskOrBug && (sprintId || assigneeId)) {
    // Ces champs ne doivent pas être utilisés pour les Epics et Stories.
    redirectWithError(project.id, "invalid");
  }

  // 5. Validation du parent selon le type d'élément
  if (type === "EPIC" && parentId) {
    redirectWithError(project.id, "parent");
  }

  let validParentId: string | null = null;

  if (type === "STORY" && parentId) {
    // Une Story peut être rattachée à un Epic du même projet.
    const epic = await prisma.epic.findFirst({
      where: {
        id: parentId,
        projectId: project.id,
      },
      select: { id: true },
    });

    if (!epic) {
      redirectWithError(project.id, "parent");
    }

    validParentId = epic.id;
  }

  if (isTaskOrBug && parentId) {
    // Une Task ou un Bug peut être rattaché à une Story du même projet,
    // même si cette Story n'est associée à aucun Epic.
    const story = await prisma.story.findFirst({
      where: {
        id: parentId,
        projectId: project.id,
      },
      select: { id: true },
    });

    if (!story) {
      redirectWithError(project.id, "parent");
    }

    validParentId = story.id;
  }

  // 6. Validation du Sprint
  if (isTaskOrBug && sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        projectId: project.id,
      },
      select: { id: true },
    });

    if (!sprint) {
      redirectWithError(project.id, "sprint");
    }
  }

  // 7. Validation du responsable
  if (isTaskOrBug && assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        OR: [
          { id: project.ownerId },
          { memberOf: { some: { id: project.id } } },
        ],
      },
      select: { id: true },
    });

    if (!assignee) {
      redirectWithError(project.id, "assignee");
    }
  }

  // 8. Création de l'élément
  if (type === "EPIC") {
    await prisma.epic.create({
      data: {
        name: title,
        description,
        projectId: project.id,
      },
    });
  } else if (type === "STORY") {
    await prisma.story.create({
      data: {
        title,
        description,
        projectId: project.id,
        epicId: validParentId,
      },
    });
  } else {
    await prisma.task.create({
      data: {
        title,
        description,
        type,
        status: rawStatus as TaskStatus,
        priority: rawPriority as TaskPriority,

        // Important : le projet est obligatoire dans ton schéma Prisma.
        projectId: project.id,

        // Une Story est facultative dans le schéma actuel.
        storyId: validParentId,
        sprintId: sprintId || null,
        assigneeId: assigneeId || null,
      },
    });
  }

  // 9. Actualisation des pages
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/projects/${project.id}/tasks/new`);
  revalidatePath(`/projects/${project.id}/sprints`);

  redirect(`/projects/${project.id}`);
}
