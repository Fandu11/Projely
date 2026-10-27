
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

type AddMemberState = {
  success?: string;
  error?: string;
};

export async function addProjectMember(
  projectId: string,
  _previousState: AddMemberState,
  formData: FormData,
): Promise<AddMemberState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "Vous devez être connecté." };
  }

  // Seul le propriétaire peut ajouter des membres.
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      members: {
        select: { id: true },
      },
    },
  });

  if (!project) {
    return {
      error: "Projet introuvable ou vous n'êtes pas propriétaire.",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Veuillez saisir une adresse e-mail valide." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return {
      error: "Aucun utilisateur inscrit ne possède cet e-mail.",
    };
  }

  if (user.id === session.user.id) {
    return { error: "Vous êtes déjà propriétaire du projet." };
  }

  if (project.members.some((member) => member.id === user.id)) {
    return { error: "Cet utilisateur est déjà membre du projet." };
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      members: {
        connect: { id: user.id },
      },
    },
  });

  revalidatePath(`/projects/${projectId}`);

  return {
    success: `${user.name || user.email} a été ajouté au projet.`,
  };
}


export async function removeProjectMember(
  projectId: string,
  memberId: string,
  _formData: FormData,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Vous devez être connecté.");
  }

  // Seul le propriétaire peut retirer un membre.
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      ownerId: true,
      members: {
        where: { id: memberId },
        select: { id: true },
      },
    },
  });

  if (!project) {
    throw new Error(
      "Projet introuvable ou vous n'êtes pas propriétaire.",
    );
  }

  // Empêcher le propriétaire de se retirer lui-même.
  if (memberId === project.ownerId) {
    throw new Error(
      "Le propriétaire ne peut pas être retiré du projet.",
    );
  }

  // Vérifier que l'utilisateur est bien membre du projet.
  if (project.members.length === 0) {
    throw new Error("Cet utilisateur n'est pas membre du projet.");
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
}

export type SprintFormState = {
  error?: string;
};

export async function createSprint(
  projectId: string,
  _previousState: SprintFormState,
  formData: FormData,
): Promise<SprintFormState> {
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
    return { error: "Projet introuvable ou accès non autorisé." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const startValue = String(formData.get("startDate") ?? "");
  const endValue = String(formData.get("endDate") ?? "");

  if (!name || name.length > 100) {
    return { error: "Le nom doit contenir entre 1 et 100 caractères." };
  }

  if (goal.length > 1000) {
    return { error: "L'objectif ne doit pas dépasser 1 000 caractères." };
  }

  if (!startValue || !endValue) {
    return { error: "Renseigne la date de début et la date de fin." };
  }

  const startDate = new Date(`${startValue}T00:00:00.000Z`);
  const endDate = new Date(`${endValue}T23:59:59.999Z`);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate > endDate
  ) {
    return { error: "La date de fin doit être égale ou postérieure à la date de début." };
  }

  await prisma.sprint.create({
    data: {
      name,
      goal: goal || null,
      startDate,
      endDate,
      projectId,
      status: "PLANNED",
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/sprints`);

  redirect(`/projects/${projectId}/sprints`);
}