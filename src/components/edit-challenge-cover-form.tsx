"use client";

import { useActionState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import { updateChallengeCoverFormAction } from "@/app/actions/challenges";
import { challenges } from "@/db/schema";
import { resolveChallengeCoverUrl } from "@/lib/media-url";

type Challenge = InferSelectModel<typeof challenges>;

export function EditChallengeCoverForm({ challenge }: { challenge: Challenge }) {
  const [state, formAction, pending] = useActionState(
    updateChallengeCoverFormAction,
    undefined,
  );

  const coverPreview = resolveChallengeCoverUrl(challenge.coverImageFile);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="ui-surface mx-4 mt-4 max-w-lg space-y-4 p-6 sm:mx-auto sm:p-7"
    >
      <input type="hidden" name="challengeId" value={challenge.id} />
      {state?.error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="text-muted mb-1.5 block text-sm font-medium">
          New cover image
        </span>
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPreview}
            alt=""
            className="border-border mb-3 aspect-[2/1] w-full rounded-xl border object-cover"
          />
        ) : (
          <p className="text-muted mb-3 text-sm">No cover yet — add one below.</p>
        )}
        <input
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-muted w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-900"
        />
        <span className="text-muted mt-1 block text-xs">
          JPEG, PNG, or WebP, up to 10MB. Replaces the current cover.
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="ui-btn-primary w-full disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update cover"}
      </button>
    </form>
  );
}
