"use client";

import { useActionState } from "react";
import { joinFromForm } from "@/app/actions/join";

export function JoinForm({
  initialCode,
  initialError,
}: {
  initialCode?: string;
  initialError?: string;
}) {
  const [state, formAction, pending] = useActionState(joinFromForm, undefined);
  const err = state?.error ?? initialError;

  return (
    <form action={formAction} className="space-y-4">
      {err && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </p>
      )}
      <input
        name="code"
        placeholder="Invite code"
        required
        defaultValue={initialCode ?? ""}
        className="ui-input w-full uppercase tracking-wider"
      />
      <button
        type="submit"
        disabled={pending}
        className="ui-btn-primary w-full disabled:opacity-50"
      >
        {pending ? "…" : "Join"}
      </button>
    </form>
  );
}
