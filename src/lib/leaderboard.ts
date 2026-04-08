import {
  dateKeyInTimezone,
  eligibleDaysInChallenge,
  totalCalendarDaysInChallenge,
} from "@/lib/dates";

export type CheckInRow = {
  createdAt: Date;
  pointsEarned: number;
};

export type LeaderboardInputUser = {
  userId: string;
  name: string;
  image: string | null;
  checkIns: CheckInRow[];
};

export type LeaderboardRow = LeaderboardInputUser & {
  totalPoints: number;
  normalizedPoints: number;
  consistencyPct: number;
  finalScore: number;
};

export function computeLeaderboard(
  users: LeaderboardInputUser[],
  opts: {
    start: Date;
    end: Date;
    now: Date;
    timeZone: string;
    rankingWeights: { points: number; consistency: number };
  },
): LeaderboardRow[] {
  const { start, end, now, timeZone, rankingWeights } = opts;
  const eligibleDays = eligibleDaysInChallenge(start, end, now, timeZone);
  const totalDaysForFinished =
    now.getTime() > end.getTime()
      ? totalCalendarDaysInChallenge(start, end, timeZone)
      : eligibleDays;

  const rows: LeaderboardRow[] = users.map((u) => {
    const totalPoints = u.checkIns.reduce((s, c) => s + c.pointsEarned, 0);
    const activeDays = new Set(
      u.checkIns.map((c) => dateKeyInTimezone(new Date(c.createdAt), timeZone)),
    ).size;
    const denom = Math.max(1, totalDaysForFinished);
    const consistencyPct = (activeDays / denom) * 100;
    return {
      ...u,
      totalPoints,
      normalizedPoints: 0,
      consistencyPct,
      finalScore: 0,
    };
  });

  const maxPoints = Math.max(0, ...rows.map((r) => r.totalPoints));
  for (const r of rows) {
    r.normalizedPoints = maxPoints === 0 ? 0 : (100 * r.totalPoints) / maxPoints;
    r.finalScore =
      r.normalizedPoints * rankingWeights.points +
      r.consistencyPct * rankingWeights.consistency;
  }

  rows.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.consistencyPct !== a.consistencyPct)
      return b.consistencyPct - a.consistencyPct;
    return a.name.localeCompare(b.name);
  });

  return rows;
}
