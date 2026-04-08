"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.signIn.email({
        email,
        password,
        callbackURL: next,
      });
      if (err) setError(err.message ?? "Sign-in failed.");
      else router.push(next);
    } finally {
      setLoading(false);
    }
  }

  async function onMagic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.signIn.magicLink({
        email,
        callbackURL: next,
      });
      if (err) setError(err.message ?? "Could not send link.");
      else setMagicSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <div className="mt-5 flex gap-2 text-sm font-medium">
        <button
          type="button"
          className={`rounded-full px-3 py-1 transition ${
            mode === "password"
              ? "bg-violet-100 text-violet-900"
              : "text-muted hover:bg-zinc-100"
          }`}
          onClick={() => setMode("password")}
        >
          Email & password
        </button>
        <span className="text-muted self-center">·</span>
        <button
          type="button"
          className={`rounded-full px-3 py-1 transition ${
            mode === "magic"
              ? "bg-violet-100 text-violet-900"
              : "text-muted hover:bg-zinc-100"
          }`}
          onClick={() => setMode("magic")}
        >
          Magic link
        </button>
      </div>
      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {magicSent && (
        <p className="text-muted mt-3 text-sm">
          Check your email (and the server console in development) for the
          magic link.
        </p>
      )}
      {mode === "password" ? (
        <form onSubmit={onPassword} className="ui-surface mt-6 space-y-4 p-6">
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
            autoComplete="current-password"
            placeholder="Password"
            className="ui-input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="ui-btn-primary w-full disabled:opacity-50"
          >
            {loading ? "…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={onMagic} className="ui-surface mt-6 space-y-4 p-6">
          <input
            type="email"
            required
            placeholder="Email"
            className="ui-input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || magicSent}
            className="ui-btn-primary w-full disabled:opacity-50"
          >
            {magicSent ? "Link sent" : "Email me a link"}
          </button>
        </form>
      )}
      <p className="text-muted mt-6 text-center text-sm">
        No account?{" "}
        <Link href="/register" className="text-accent underline">
          Register
        </Link>
      </p>
    </div>
  );
}
