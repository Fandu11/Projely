
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function updateProfile(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (
    !firstName ||
    !lastName ||
    firstName.length > 80 ||
    lastName.length > 80 ||
    jobTitle.length > 100 ||
    bio.length > 1000
  ) {
    redirect("/profile?error=invalid");
  }

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      firstName,
      lastName,
      jobTitle: jobTitle || null,
      bio: bio || null,
      name: `${firstName} ${lastName}`,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");

  redirect("/profile?updated=1");
}
