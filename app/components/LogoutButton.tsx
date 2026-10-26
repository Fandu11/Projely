
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const result = await signOut();

      if (result.error) {
        setError("La déconnexion a échoué.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Impossible de se déconnecter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="rounded border px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
      >
        {loading ? "Déconnexion..." : "Se déconnecter"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
