"use client";

import { useState } from "react";

export function CopyInviteButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      className="text-accent hover:bg-violet-50 w-full rounded-xl border border-violet-200/80 bg-white px-4 py-2.5 text-left text-sm font-medium shadow-sm transition hover:border-violet-300"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Copied!" : "Copy invite link"}
    </button>
  );
}
