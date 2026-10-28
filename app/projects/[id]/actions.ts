
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const allowedStatuses = [
  "TODO",
  "IN_PROGRESS",
  "TO_REVIEW",
  "DONE",
] as const;

const allowedTypes = ["TASK", "BUG"] as const;

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

async function getAccessibleProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: { id: userId },
          },
        },
      ],
    },
    select: {
      id: true,
      ownerId: true,
    },
  });
}

export async function createTask(
  projectId: string,
  formData: FormData,
) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const project = await getAccessibleProject(
    projectId,
    session.user.id,
  );

  if (!project) {
    redirect("/projects");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(
    formData.get("description") ?? "",
  ).trim();
  const status = String(formData.get("status") ?? "TODO");
  const type = String(formData.get("type") ?? "TASK");

  // La Story est facultative.
  const storyId =
    String(formData.get("storyId") ?? "").trim() || null;

  const isValidStatus = allowedStatuses.some(
    (value) => value === status,
  );

  const isValidType = allowedTypes.some(
    (value) => value === type,
  );

  if (
    title.length < 1 ||
    title.length > 150 ||
    description.length > 2000 ||
    !isValidStatus ||
    !isValidType
  ) {
    redirect(`/projects/${projectId}?error=invalid`);
  }

  // Si une Story est indiquée, vérifier qu'elle appartient au projet.
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
      redirect(`/projects/${projectId}?error=invalid`);
    }
  }

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      status: status as (typeof allowedStatuses)[number],
      type: type as (typeof allowedTypes)[number],
      projectId: project.id,
      storyId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function addProjectMember(
  projectId: string,
  formData: FormData,
) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    select: { id: true },
  });

  if (!project) {
    redirect(`/projects/${projectId}?error=forbidden`);
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || email.length > 254) {
    redirect(`/projects/${projectId}?error=invalid`);
  }

  const member = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!member) {
    redirect(`/projects/${projectId}?error=member-not-found`);
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      members: {
        connect: { id: member.id },
      },
    },
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function removeProjectMember(
  projectId: string,
  formData: FormData,
) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    select: { id: true },
  });

  if (!project) {
    redirect(`/projects/${projectId}?error=forbidden`);
  }

  const memberId = String(
    formData.get("memberId") ?? "",
  ).trim();

  if (!memberId || memberId === session.user.id) {
    redirect(`/projects/${projectId}?error=invalid`);
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      members: {
        disconnect: { id: memberId },
      },
    },
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function createSprint(
  projectId: string,
  formData: FormData,
) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const project = await getAccessibleProject(
    projectId,
    session.user.id,
  );

  if (!project) {
    redirect("/projects");
  }

  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const startDateValue = String(
    formData.get("startDate") ?? "",
  );
  const endDateValue = String(
    formData.get("endDate") ?? "",
  );

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  if (
    name.length < 1 ||
    name.length > 150 ||
    goal.length > 2000 ||
    !startDateValue ||
    !endDateValue ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    redirect(`/projects/${projectId}?error=invalid`);
  }

  await prisma.sprint.create({
    data: {
      name,
      goal: goal || null,
      startDate,
      endDate,
      projectId: project.id,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}
