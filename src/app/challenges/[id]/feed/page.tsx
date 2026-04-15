import { desc, eq } from "drizzle-orm";
import { CirclePlus } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { challenges, checkIns } from "@/db/schema";
import { CheckInCard } from "@/components/check-in-card";
import { getChallengeStatus } from "@/lib/challenges/status";
import { getSession } from "@/lib/session";

export default async function ChallengeFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ merged?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const merged = Number(sp.merged);
  const session = await getSession();
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
  });
  if (!ch) return null;

  const status = getChallengeStatus(ch.startDate, ch.endDate);

  const rows = await db.query.checkIns.findMany({
    where: eq(checkIns.challengeId, id),
    orderBy: [desc(checkIns.createdAt)],
    limit: 100,
    with: {
      user: true,
      reactions: true,
      comments: {
        with: { user: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
      {Number.isFinite(merged) && merged >= 0 && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm leading-relaxed text-zinc-700">
          {merged === 0
            ? "Already up to date — no NuCel activities were missing."
            : `Added ${merged} NuCel ${merged === 1 ? "activity" : "activities"}.`}
        </div>
      )}
      {status === "active" && (
        <Link
          href={`/challenges/${id}/check-in`}
          className="ui-btn-primary flex items-center justify-center gap-2 !py-4 text-[15px] shadow-lg shadow-purple-900/20"
        >
          <CirclePlus className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          Log a workout (check-in)
        </Link>
      )}
      {status === "upcoming" && (
        <p className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-4 text-center text-sm leading-relaxed text-zinc-600">
          Check-ins are not open yet. When the challenge is{" "}
          <span className="text-foreground font-medium">active</span>, use{" "}
          <span className="text-foreground font-medium">Log</span> in the bottom
          bar or the button in the header.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-muted text-center text-sm">
          No check-ins yet. Be the first to post a workout.
        </p>
      ) : (
        rows.map((row) => {
          const comments = [...row.comments].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          return (
            <CheckInCard
              key={row.id}
              id={row.id}
              activityType={row.activityType}
              durationMin={row.durationMin}
              distanceKm={row.distanceKm}
              elevationM={row.elevationM}
              pointsEarned={row.pointsEarned}
              photoUrl={row.photoUrl}
              description={row.description}
              workoutStartTime={row.workoutStartTime}
              workoutEndTime={row.workoutEndTime}
              createdAt={new Date(row.createdAt).toISOString()}
              user={{
                id: row.user.id,
                name: row.user.name,
                image: row.user.image,
              }}
              reactions={row.reactions.map((r) => ({
                emoji: r.emoji,
                userId: r.userId,
              }))}
              comments={comments.map((c) => ({
                id: c.id,
                text: c.text,
                createdAt: new Date(c.createdAt).toISOString(),
                user: { name: c.user.name },
              }))}
              currentUserId={session!.user.id}
            />
          );
        })
      )}
    </div>
  );
}
