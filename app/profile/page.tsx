
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { updateProfile } from "./action";

type ProfilePageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

export const instant = false;

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const [user, params] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        bio: true,
      },
    }),
    searchParams,
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Mon profil
        </h1>
        <p className="mt-2 text-slate-600">
          Gérez vos informations personnelles et professionnelles.
        </p>
      </div>

      {params.updated === "1" && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          Votre profil a été mis à jour.
        </p>
      )}

      {params.error === "invalid" && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Vérifiez les champs obligatoires et les longueurs autorisées.
        </p>
      )}

      <form
        action={updateProfile}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            L&apos;adresse e-mail ne peut pas être modifiée ici.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Prénom *
            </label>
            <input
              id="firstName"
              name="firstName"
              required
              maxLength={80}
              defaultValue={user.firstName ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nom *
            </label>
            <input
              id="lastName"
              name="lastName"
              required
              maxLength={80}
              defaultValue={user.lastName ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="jobTitle"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Poste / fonction
          </label>
          <input
            id="jobTitle"
            name="jobTitle"
            maxLength={100}
            placeholder="Ex. : Développeur full stack"
            defaultValue={user.jobTitle ?? ""}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Biographie
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
            maxLength={1000}
            placeholder="Présentez-vous en quelques phrases..."
            defaultValue={user.bio ?? ""}
            className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            1 000 caractères maximum.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </main>
  );
}
