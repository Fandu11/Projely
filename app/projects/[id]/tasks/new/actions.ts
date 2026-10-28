
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/app/lib/auth";
import {prisma} from "@/app/lib/prisma";

const elementTypes = ["EPIC", "STORY", "TASK", "BUG"] as const;
const statuses = ["TODO", "IN_PROGRESS", "TO_REVIEW", "DONE"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type ElementType = (typeof elementTypes)[number];
type TaskStatus = (typeof statuses)[number];
type TaskPriority = (typeof priorities)[number];

function redirectWithError(projectId: string, error: string): never {
  redirect(`/projects/${projectId}/tasks/new?error=${error}`);
}

export async function createProjectElement(
  projectId: string,
  formData: FormData,
): Promise<void> {
  // Vérification de l'authentification.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Vérification de l'accès au projet.
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: {
              id: session.user.id,
            },
          },
        },
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

  // Récupération des champs du formulaire.
  const rawType = String(formData.get("type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;

  const parentId = String(formData.get("parentId") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "TODO").trim();
  const rawPriority = String(formData.get("priority") ?? "MEDIUM").trim();

  const sprintId = String(formData.get("sprintId") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();

  // Validation générale.
  if (
    !elementTypes.includes(rawType as ElementType) ||
    title.length === 0 ||
    title.length > 200 ||
    (description !== null && description.length > 5000)
  ) {
    redirectWithError(projectId, "invalid");
  }

  const type = rawType as ElementType;

  // Le statut et la priorité ne s'appliquent qu'aux Tasks et aux Bugs.
  if (
    (type === "TASK" || type === "BUG") &&
    (!statuses.includes(rawStatus as TaskStatus) ||
      !priorities.includes(rawPriority as TaskPriority))
  ) {
    redirectWithError(projectId, "invalid");
  }

  // Un Epic ne possède pas de parent dans le schéma actuel.
  if (type === "EPIC" && parentId) {
    redirectWithError(projectId, "parent");
  }

  // Le parent est facultatif.
  // S'il est renseigné, on vérifie son type et son appartenance au projet.
  if (parentId && type === "STORY") {
    const parentEpic = await prisma.epic.findFirst({
      where: {
        id: parentId,
        projectId: project.id,
      },
      select: {
        id: true,
      },
    });

    if (!parentEpic) {
      redirectWithError(projectId, "parent");
    }
  }

  if (parentId && (type === "TASK" || type === "BUG")) {
    const parentStory = await prisma.story.findFirst({
      where: {
        id: parentId,
        epic: {
          projectId: project.id,
        },
      },
      select: {
        id: true,
      },
    });

    // Une Story sans Epic est également autorisée.
    // Le filtre précédent ne trouve pas ces Stories sans Epic.
    // On vérifie donc aussi les Stories autonomes.
    const standaloneStory =
      parentStory ??
      (await prisma.story.findFirst({
        where: {
          id: parentId,
          epicId: null,
        },
        select: {
          id: true,
        },
      }));

    if (!standaloneStory) {
      redirectWithError(projectId, "parent");
    }
  }

  // Sprint et assignation : uniquement pour les Tasks et les Bugs.
  const supportsTaskFields = type === "TASK" || type === "BUG";

  if (supportsTaskFields && sprintId) {
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
      redirectWithError(projectId, "sprint");
    }
  }

  if (supportsTaskFields && assigneeId) {
    const member = await prisma.user.findFirst({
      where: {
        id: assigneeId,
        OR: [
          { id: project.ownerId },
          {
            memberOf: {
              some: {
                id: project.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      redirectWithError(projectId, "assignee");
    }
  }

  // Création selon le type choisi.
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
        epicId: parentId || null,
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
        storyId: parentId || null,
        sprintId: sprintId || null,
        assigneeId: assigneeId || null,
      },
    });
  }

  // Actualisation des pages concernées.
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/projects/${project.id}/tasks/new`);
  revalidatePath(`/projects/${project.id}/sprints`);

  redirect(`/projects/${project.id}`);
}
