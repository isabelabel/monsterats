import { CirclePlus } from "lucide-react";
import Link from "next/link";
import { CopyInviteButton } from "@/components/copy-invite-button";
import { MergeNucelActivitiesForm } from "@/components/merge-nucel-activities-form";
import { UserAvatar } from "@/components/user-avatar";

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
  allowCheckIn,
  leader,
  you,
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
  allowCheckIn: boolean;
  leader: LeaderboardSnap;
  you: LeaderboardSnap;
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

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {challengeName}
            </h1>
            <p className="text-muted mt-0.5 text-xs capitalize">{status}</p>
          </div>
          {allowCheckIn && (
            <Link
              href={`/challenges/${challengeId}/check-in`}
              className="ui-btn-primary inline-flex !shrink-0 items-center gap-1.5 !px-4 !py-2 text-sm"
            >
              <CirclePlus className="h-4 w-4" strokeWidth={2.5} />
              Check in
            </Link>
          )}
        </div>
        {status === "upcoming" && (
          <p className="text-muted rounded-xl bg-violet-50/80 px-3 py-2 text-xs leading-relaxed">
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
          <p className="text-muted rounded-xl bg-zinc-100/90 px-3 py-2 text-xs">
            This challenge has ended — check-ins are closed.
          </p>
        )}
        <p className="text-muted break-all font-mono text-xs">
          Code {inviteCode}
        </p>
        <CopyInviteButton text={shareUrl} />
        {creatorId === sessionUserId && (
          <div className="border-border/60 space-y-1.5 border-t border-dashed pt-3">
            <p className="text-muted text-[11px] leading-relaxed">
              This challenge keeps its own activity list. To pull in new names
              from the app&apos;s NuCel template without removing yours:
            </p>
            <MergeNucelActivitiesForm challengeId={challengeId} />
          </div>
        )}
        {creatorId === sessionUserId && status === "upcoming" && (
          <Link
            href={`/challenges/${challengeId}/edit`}
            className="text-muted text-xs underline"
          >
            Edit rules & cover
          </Link>
        )}
        {creatorId === sessionUserId &&
          (status === "active" || status === "finished") && (
            <Link
              href={`/challenges/${challengeId}/edit`}
              className="text-muted text-xs underline"
            >
              Change cover
            </Link>
          )}
      </div>
    </div>
  );
}
