import { eq } from "drizzle-orm";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import { UserAvatar } from "@/components/user-avatar";
import { loadChallengeLeaderboardRows } from "@/lib/load-challenge-leaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
  });
  if (!ch) return null;

  const lb = await loadChallengeLeaderboardRows(id);
  if (!lb) return null;
  const rows = lb.rows;

  return (
    <div className="mx-auto max-w-lg px-4 py-5">
      <div className="ui-surface !rounded-2xl !p-4">
        <p className="text-muted text-xs leading-relaxed">
          Final = normalized points × {ch.rankingWeights.points} + consistency ×{" "}
          {ch.rankingWeights.consistency}
        </p>
      </div>
      <ul className="mt-6 space-y-3">
        {rows.map((r, i) => (
          <li
            key={r.userId}
            className={`ui-surface flex items-center gap-3 !rounded-2xl !p-4 ${
              i < 3 ? "ring-2 ring-violet-300/70" : ""
            }`}
          >
            <span className="text-muted w-8 text-center text-lg font-semibold">
              {MEDALS[i] ?? i + 1}
            </span>
            <UserAvatar name={r.name} imageUrl={r.image} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.name}</p>
              <p className="text-muted text-xs">
                {r.totalPoints.toFixed(2)} pts ·{" "}
                {r.consistencyPct.toFixed(0)}% consistency
              </p>
            </div>
            <div className="text-right">
              <p className="text-accent font-semibold tabular-nums">
                {r.finalScore.toFixed(2)}
              </p>
              <p className="text-muted text-[10px]">score</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
