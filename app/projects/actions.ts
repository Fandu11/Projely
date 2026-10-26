
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function createProject(formData: FormData) {
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
    redirect("/projects/new?error=invalid");
  }

  await prisma.project.create({
    data: {
      name,
      description: description || null,
      ownerId: session.user.id,
      members: {
        connect: {
          id: session.user.id,
        },
      },
    },
  });

  revalidatePath("/projects");
  revalidatePath("/", "layout");

  redirect("/projects");
}
