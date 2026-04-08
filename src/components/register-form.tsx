"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (err) setError(err.message ?? "Registration failed.");
      else router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="ui-surface mt-6 space-y-4 p-6">
        <input
          type="text"
          required
          placeholder="Name"
          className="ui-input w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          className="ui-input w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Password (min 8 chars)"
          minLength={8}
          className="ui-input w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="ui-btn-primary w-full disabled:opacity-50"
        >
          {loading ? "…" : "Register"}
        </button>
      </form>
      <p className="text-muted mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-accent underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
