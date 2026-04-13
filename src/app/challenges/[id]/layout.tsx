import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChallengeHeaderCard } from "@/components/challenge-header-card";
import { ChallengeNav } from "@/components/challenge-nav";
import { db } from "@/db";
import { challengeMemberships, challenges } from "@/db/schema";
import { getChallengeStatus } from "@/lib/challenges/status";
import { loadChallengeLeaderboardRows } from "@/lib/load-challenge-leaderboard";
import { resolveChallengeCoverUrl } from "@/lib/media-url";
import { parseScoringRules, type ScoringRules } from "@/lib/scoring/types";
import { getSession } from "@/lib/session";

export default async function ChallengeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/challenges/${id}/feed`)}`);
  }

  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
  });
  if (!ch) redirect("/");

  const member = await db.query.challengeMemberships.findFirst({
    where: and(
      eq(challengeMemberships.challengeId, id),
      eq(challengeMemberships.userId, session.user.id),
    ),
  });
  if (!member) redirect("/");

  const status = getChallengeStatus(ch.startDate, ch.endDate);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${proto}://${host}/join/${ch.inviteCode}`;

  const lb = await loadChallengeLeaderboardRows(id);
  if (!lb) redirect("/");

  const leaderRow = lb.rows[0];
  const youRow = lb.rows.find((r) => r.userId === session.user.id);
  const leader = leaderRow
    ? {
        name: leaderRow.name,
        image: leaderRow.image,
        finalScore: leaderRow.finalScore,
      }
    : {
        name: session.user.name,
        image: session.user.image ?? null,
        finalScore: 0,
      };
  const you = youRow
    ? {
        name: youRow.name,
        image: youRow.image,
        finalScore: youRow.finalScore,
      }
    : leader;

  const coverUrl = resolveChallengeCoverUrl(ch.coverImageFile);

  let scoringRules: ScoringRules | null = null;
  try {
    scoringRules = parseScoringRules(ch.scoringRules);
  } catch {
    scoringRules = null;
  }

  return (
    <div className="pb-nav">
      <div className="px-4 pt-4">
        <ChallengeHeaderCard
          challengeId={id}
          challengeName={ch.name}
          status={status}
          coverUrl={coverUrl}
          shareUrl={shareUrl}
          inviteCode={ch.inviteCode}
          startDate={new Date(ch.startDate)}
          sessionUserId={session.user.id}
          creatorId={ch.creatorId}
          leader={leader}
          you={you}
          scoringRules={scoringRules}
        />
      </div>
      {children}
      <ChallengeNav challengeId={id} allowCheckIn={status === "active"} />
    </div>
  );
}
