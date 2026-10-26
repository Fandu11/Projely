
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

type TaskStatus = (typeof allowedStatuses)[number];

export async function createTask(
  projectId: string,
  formData: FormData,
) {
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
    select: { id: true },
  });

  if (!project) {
    redirect("/projects");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(
    formData.get("description") ?? "",
  ).trim();
  const rawStatus = String(formData.get("status") ?? "TODO");

  if (
    title.length < 1 ||
    title.length > 150 ||
    description.length > 2000 ||
    !allowedStatuses.includes(rawStatus as TaskStatus)
  ) {
    redirect(`/projects/${projectId}?error=invalid`);
  }

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      status: rawStatus as TaskStatus,
      projectId: project.id,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}
