"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  mergeNucelActivitiesFormAction,
  type MergeNucelActivitiesState,
} from "@/app/actions/challenges";

/** Organizer-only: append activities from the bundled NuCel template missing from this challenge. */
export function MergeNucelActivitiesForm({
  challengeId,
}: {
  challengeId: string;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    MergeNucelActivitiesState | undefined,
    FormData
  >(mergeNucelActivitiesFormAction, undefined);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="inline-flex max-w-full flex-col gap-1">
      <input type="hidden" name="challengeId" value={challengeId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-muted hover:text-accent disabled:opacity-60 text-left text-xs underline"
      >
        {isPending
          ? "Adding…"
          : "Add missing activities from latest NuCel list"}
      </button>
      {state?.ok === false && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] leading-snug text-red-800"
          role="status"
        >
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p
          className="text-muted text-[11px] leading-snug"
          role="status"
          aria-live="polite"
        >
          {state.added === 0
            ? "Already up to date — no NuCel activities were missing."
            : `Added ${state.added} NuCel ${state.added === 1 ? "activity" : "activities"}.`}
        </p>
      )}
    </form>
  );
}
