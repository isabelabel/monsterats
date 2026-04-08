import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  challengeMemberships,
  challenges,
  checkIns,
} from "@/db/schema";
import { computeLeaderboard } from "@/lib/leaderboard";

export async function loadChallengeLeaderboardRows(challengeId: string) {
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!ch) return null;

  const members = await db.query.challengeMemberships.findMany({
    where: eq(challengeMemberships.challengeId, challengeId),
    with: { user: true },
  });

  const allCheckIns = await db.query.checkIns.findMany({
    where: eq(checkIns.challengeId, challengeId),
  });

  const users = members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    image: m.user.image,
    checkIns: allCheckIns
      .filter((c) => c.userId === m.userId)
      .map((c) => ({
        createdAt: new Date(c.createdAt),
        pointsEarned: c.pointsEarned,
      })),
  }));

  const rows = computeLeaderboard(users, {
    start: new Date(ch.startDate),
    end: new Date(ch.endDate),
    now: new Date(),
    timeZone: ch.timezone,
    rankingWeights: ch.rankingWeights,
  });

  return { challenge: ch, rows };
}
