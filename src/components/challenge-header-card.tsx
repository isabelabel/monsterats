import Link from "next/link";
import { ChallengeScoringRulesModalButton } from "@/components/challenge-scoring-rules-modal";
import { CopyInviteButton } from "@/components/copy-invite-button";
import { MergeNucelActivitiesForm } from "@/components/merge-nucel-activities-form";
import { UserAvatar } from "@/components/user-avatar";
import type { ScoringRules } from "@/lib/scoring/types";

type LeaderboardSnap = {
  name: string;
  image: string | null;
  finalScore: number;
};

export function ChallengeHeaderCard({
  challengeId,
  challengeName,
  status,
  coverUrl,
  shareUrl,
  inviteCode,
  startDate,
  sessionUserId,
  creatorId,
  leader,
  you,
  scoringRules,
}: {
  challengeId: string;
  challengeName: string;
  status: string;
  coverUrl: string | null;
  shareUrl: string;
  inviteCode: string;
  startDate: Date;
  sessionUserId: string;
  creatorId: string;
  leader: LeaderboardSnap;
  you: LeaderboardSnap;
  /** Parsed challenge scoring rules; when null, the scoring link is hidden. */
  scoringRules: ScoringRules | null;
}) {
  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="ui-surface mx-auto max-w-lg overflow-hidden !rounded-2xl !p-0 !shadow-md">
      <div className="relative aspect-[2/1] w-full min-h-[128px] overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-zinc-900">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      </div>

      <Link
        href={`/challenges/${challengeId}/leaderboard`}
        className="border-border/20 flex items-stretch gap-2 border-t bg-zinc-900 px-3 py-3 text-white transition hover:bg-zinc-800/95"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <UserAvatar
            name={leader.name}
            imageUrl={leader.image}
            size={44}
            className="ring-zinc-600 ring-offset-zinc-900"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none tabular-nums">
              {fmt(leader.finalScore)}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Leader
            </p>
          </div>
        </div>
        <div className="bg-zinc-700/50 w-px shrink-0 self-stretch" />
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
          <div className="min-w-0 text-right">
            <p className="text-lg font-bold leading-none tabular-nums">
              {fmt(you.finalScore)}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              You
            </p>
          </div>
          <UserAvatar
            name={you.name}
            imageUrl={you.image}
            size={44}
            className="ring-zinc-600 ring-offset-zinc-900"
          />
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight">
              {challengeName}
            </h1>
            <p
              className="mt-2 inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide text-zinc-600"
              title="Challenge status"
            >
              {status}
            </p>
          </div>
          {scoringRules && (
            <div className="flex w-[min(100%,10.5rem)] shrink-0 flex-col gap-2">
              <ChallengeScoringRulesModalButton rules={scoringRules} />
            </div>
          )}
        </div>

        {status === "upcoming" && (
          <p className="text-muted rounded-xl bg-violet-50/80 px-3 py-2.5 text-xs leading-relaxed">
            Check-ins open once the challenge starts (
            {startDate.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            ). Use the <strong className="text-foreground">Log</strong> tab in
            the bottom bar then.
          </p>
        )}
        {status === "finished" && (
          <p className="text-muted rounded-xl bg-zinc-100/90 px-3 py-2.5 text-xs leading-relaxed">
            This challenge has ended — check-ins are closed.
          </p>
        )}

        <div className="border-border/70 rounded-xl border bg-zinc-50/70 px-3 py-3">
          <p className="text-muted mb-2 text-[10px] font-semibold uppercase tracking-wider">
            Invite
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-foreground min-w-0 truncate font-mono text-sm font-medium tracking-wide">
              {inviteCode}
            </p>
            <CopyInviteButton text={shareUrl} variant="compact" />
          </div>
        </div>

        {creatorId === sessionUserId && (
          <div className="border-border/50 space-y-2.5 border-t border-dashed pt-4">
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wider">
              Organizer
            </p>
            <p className="text-muted text-xs leading-relaxed">
              This challenge has its own activity list. Add names from the
              app&apos;s NuCel template without removing yours:
            </p>
            <MergeNucelActivitiesForm challengeId={challengeId} />
            <div className="flex flex-col gap-1.5 pt-0.5">
              {status === "upcoming" && (
                <Link
                  href={`/challenges/${challengeId}/edit`}
                  className="text-muted hover:text-foreground text-xs underline underline-offset-2 transition-colors"
                >
                  Edit rules & cover
                </Link>
              )}
              {(status === "active" || status === "finished") && (
                <Link
                  href={`/challenges/${challengeId}/edit`}
                  className="text-muted hover:text-foreground text-xs underline underline-offset-2 transition-colors"
                >
                  Change cover
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
