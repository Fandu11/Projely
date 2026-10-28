
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function updateProjectSettings(
  projectId: string,
  formData: FormData,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(
    formData.get("description") ?? "",
  ).trim();

  if (
    name.length < 2 ||
    name.length > 100 ||
    description.length > 2000
  ) {
    redirect(`/projects/${projectId}?tab=settings&error=invalid`);
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    throw new Error(
      "Projet introuvable ou autorisation insuffisante.",
    );
  }

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      name,
      description: description || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);

  redirect(`/projects/${projectId}?tab=settings&saved=1`);
}
