"use client";

import { ListOrdered, X } from "lucide-react";
import { useCallback, useRef } from "react";
import { ChallengeScoringRulesList } from "@/components/challenge-scoring-rules-card";
import type { ScoringRules } from "@/lib/scoring/types";

export function ChallengeScoringRulesModalButton({
  rules,
  className = "",
}: {
  rules: ScoringRules | null;
  /** Merged onto the trigger button (e.g. w-full). */
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  if (!rules) return null;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`ui-btn-secondary inline-flex w-full items-center justify-center gap-2 !rounded-xl !px-3 !py-2.5 text-sm ${className}`.trim()}
      >
        <ListOrdered className="text-accent h-4 w-4 shrink-0" strokeWidth={2} />
        Scoring rules
      </button>
      <dialog
        ref={dialogRef}
        className="border-border bg-card text-foreground fixed top-1/2 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-0 shadow-xl backdrop:bg-black/50"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="flex max-h-[min(85vh,640px)] flex-col">
          <div className="border-border flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className="text-foreground text-sm font-semibold tracking-tight">
              Scoring rules
            </h2>
            <button
              type="button"
              onClick={close}
              className="text-muted hover:text-foreground rounded-lg p-1.5 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-4">
            <ChallengeScoringRulesList rules={rules} />
          </div>
        </div>
      </dialog>
    </>
  );
}
