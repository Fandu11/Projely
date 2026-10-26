
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/app/lib/auth-client";

export default function LoginPage() {
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
      const result = await signIn.email({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });

      if (result.error) {
        setError("E-mail ou mot de passe incorrect.");
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
        Connexion
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Mot de passe"
          autoComplete="current-password"
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
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4">
        Pas encore de compte ?{" "}
        <Link href="/register" className="underline">
          S'inscrire
        </Link>
      </p>
    </main>
  );
}
