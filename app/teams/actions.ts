
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

function getField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function requireTeamOwner(teamId: string, userId: string) {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      ownerId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!team) {
    throw new Error("Équipe introuvable ou accès refusé.");
  }

  return team;
}

export async function createTeam(formData: FormData) {
  const user = await requireUser();

  const name = getField(formData, "name");
  const description = getField(formData, "description");

  if (!name || name.length > 80 || description.length > 500) {
    redirect("/teams?error=invalid");
  }

  const team = await prisma.team.create({
    data: {
      name,
      description: description || null,
      owner: {
        connect: { id: user.id },
      },
      members: {
        connect: { id: user.id },
      },
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/teams");
  redirect(`/teams/${team.id}`);
}

export async function updateTeam(formData: FormData) {
  const user = await requireUser();

  const teamId = getField(formData, "teamId");
  const name = getField(formData, "name");
  const description = getField(formData, "description");

  if (
    !teamId ||
    !name ||
    name.length > 80 ||
    description.length > 500
  ) {
    redirect(`/teams/${teamId}?error=invalid`);
  }

  await requireTeamOwner(teamId, user.id);

  await prisma.team.update({
    where: { id: teamId },
    data: {
      name,
      description: description || null,
    },
  });

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);

  redirect(`/teams/${teamId}?success=updated`);
}

export async function addTeamMember(formData: FormData) {
  const user = await requireUser();

  const teamId = getField(formData, "teamId");
  const email = getField(formData, "email").toLowerCase();

  if (!teamId || !email || email.length > 254) {
    redirect(`/teams/${teamId}?error=invalid`);
  }

  await requireTeamOwner(teamId, user.id);

  const member = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (!member) {
    redirect(`/teams/${teamId}?error=user-not-found`);
  }

  const existingMembership = await prisma.team.findFirst({
    where: {
      id: teamId,
      members: {
        some: { id: member.id },
      },
    },
    select: {
      id: true,
    },
  });

  if (existingMembership) {
    redirect(`/teams/${teamId}?error=already-member`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      members: {
        connect: { id: member.id },
      },
    },
  });

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);

  redirect(`/teams/${teamId}?success=member-added`);
}

export async function removeTeamMember(formData: FormData) {
  const user = await requireUser();

  const teamId = getField(formData, "teamId");
  const memberId = getField(formData, "memberId");

  if (!teamId || !memberId) {
    redirect("/teams");
  }

  await requireTeamOwner(teamId, user.id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      ownerId: true,
    },
  });

  if (!team) {
    redirect("/teams");
  }

  // Le propriétaire reste membre de son équipe.
  if (memberId === team.ownerId) {
    redirect(`/teams/${teamId}?error=cannot-remove-owner`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      members: {
        disconnect: { id: memberId },
      },
    },
  });

  revalidatePath("/teams");
  revalidatePath(`/teams/${teamId}`);

  redirect(`/teams/${teamId}?success=member-removed`);
}


export async function deleteTeam(formData: FormData) {
  const user = await requireUser();

  const teamId = getField(formData, "teamId");
  const confirmation = getField(formData, "confirmation");

  if (!teamId) {
    redirect("/teams");
  }

  if (confirmation !== "SUPPRIMER") {
    redirect(`/teams/${teamId}?error=invalid`);
  }

  await requireTeamOwner(teamId, user.id);

  await prisma.team.delete({
    where: { id: teamId },
  });

  revalidatePath("/teams");
  redirect("/teams?success=deleted");
}

