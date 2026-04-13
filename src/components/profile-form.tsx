"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { UserAvatar } from "@/components/user-avatar";
import {
  reencodeImageForUpload,
  shouldReencodeImageForUpload,
} from "@/lib/reencode-image-for-upload";

export function ProfileForm({
  initialName,
  initialImage,
}: {
  initialName: string;
  initialImage: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    undefined,
  );
  const [prepareError, setPrepareError] = useState<string | undefined>();
  const [optimizing, setOptimizing] = useState(false);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      onSubmit={async (e) => {
        e.preventDefault();
        setPrepareError(undefined);
        const form = e.currentTarget;
        const fd = new FormData(form);
        const avatar = fd.get("avatar");
        if (avatar instanceof File && avatar.size > 0) {
          if (shouldReencodeImageForUpload(avatar)) {
            setOptimizing(true);
            try {
              fd.set("avatar", await reencodeImageForUpload(avatar));
            } catch {
              setPrepareError(
                "Could not read this photo. Try another image or export as JPEG.",
              );
              return;
            } finally {
              setOptimizing(false);
            }
          }
        }
        formAction(fd);
      }}
      className="ui-surface mx-auto max-w-sm space-y-5 p-6"
    >
      {(state?.error || prepareError) && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {prepareError ?? state?.error}
        </p>
      )}
      <div className="flex justify-center">
        <UserAvatar name={initialName} imageUrl={initialImage} size={96} />
      </div>
      <label className="block">
        <span className="text-muted mb-1.5 block text-sm font-medium">
          Display name
        </span>
        <input
          name="name"
          defaultValue={initialName}
          className="ui-input w-full"
        />
      </label>
      <label className="block">
        <span className="text-muted mb-1.5 block text-sm font-medium">
          New avatar
        </span>
        <input
          type="file"
          name="avatar"
          accept="image/*"
          className="text-muted w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-900"
        />
      </label>
      <button
        type="submit"
        disabled={pending || optimizing}
        className="ui-btn-primary w-full disabled:opacity-50"
      >
        {pending ? "Saving…" : optimizing ? "Preparing photo…" : "Save profile"}
      </button>
    </form>
  );
}
