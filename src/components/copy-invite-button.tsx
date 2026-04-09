"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";

export function CopyInviteButton({
  text,
  variant = "default",
}: {
  text: string;
  /** `compact`: side-by-side with invite code in the header card. */
  variant?: "default" | "compact";
}) {
  const [done, setDone] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onCopy}
        className="ui-btn-secondary inline-flex shrink-0 items-center gap-1.5 !rounded-lg !px-3 !py-2 text-xs font-semibold"
        aria-label={done ? "Copied" : "Copy invite link"}
      >
        <Link2 className="text-accent h-3.5 w-3.5" strokeWidth={2.5} />
        {done ? "Copied" : "Copy link"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="text-accent hover:bg-violet-50 w-full rounded-xl border border-violet-200/80 bg-white px-4 py-2.5 text-left text-sm font-medium shadow-sm transition hover:border-violet-300"
    >
      {done ? "Copied!" : "Copy invite link"}
    </button>
  );
}
