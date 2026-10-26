
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/app/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const result = await signUp.email({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      });

      if (result.error) {
        setError(
          result.error.message ?? "Inscription impossible."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-md p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Créer un compte
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          type="text"
          placeholder="Nom"
          autoComplete="name"
          required
          className="w-full rounded border p-3"
        />

        <input
          name="email"
          type="email"
          placeholder="Adresse e-mail"
          autoComplete="email"
          required
          className="w-full rounded border p-3"
        />

        <input
          name="password"
          type="password"
          placeholder="Mot de passe (8 caractères minimum)"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded border p-3"
        />

        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black p-3 text-white disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-4">
        Déjà inscrit ?{" "}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
