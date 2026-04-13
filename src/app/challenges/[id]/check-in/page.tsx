import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { CheckInWizard } from "@/components/check-in-wizard";
import { db } from "@/db";
import { challenges, checkIns } from "@/db/schema";
import { dateKeyInTimezone } from "@/lib/dates";
import { getChallengeStatus } from "@/lib/challenges/status";
import { countHighIntensityCheckIns, parseScoringRules } from "@/lib/scoring/types";
import { getSession } from "@/lib/session";

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
  });
  if (!ch) return null;

  const status = getChallengeStatus(ch.startDate, ch.endDate);
  let rules;
  try {
    rules = parseScoringRules(ch.scoringRules);
  } catch {
    return (
      <p className="text-muted p-6 text-center text-sm">
        This challenge has invalid scoring rules.
      </p>
    );
  }

  if (status !== "active") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-muted text-sm">
          Check-ins open only while the challenge is active.
        </p>
        <Link href={`/challenges/${id}/feed`} className="text-accent mt-4 inline-block text-sm">
          Back to feed
        </Link>
      </div>
    );
  }

  const session = await getSession();
  const now = new Date();
  const todayKey = dateKeyInTimezone(now, ch.timezone);
  const priorHighIntensityCheckInsToday =
    session == null
      ? 0
      : countHighIntensityCheckIns(
          rules,
          (
            await db.query.checkIns.findMany({
              where: and(
                eq(checkIns.challengeId, id),
                eq(checkIns.userId, session.user.id),
              ),
            })
          ).filter(
            (c) => dateKeyInTimezone(new Date(c.createdAt), ch.timezone) === todayKey,
          ),
        );

  return (
    <div>
      <div className="px-4 pt-5">
        <div className="ui-surface mx-auto max-w-lg !rounded-2xl !p-4">
          <h2 className="text-foreground text-sm font-semibold tracking-tight">
            Log a workout
          </h2>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Pick an activity, duration, and optional photo. Unlisted activities
            count as 1 pt.
          </p>
        </div>
      </div>
      <CheckInWizard
        challengeId={id}
        scoringRules={rules}
        priorHighIntensityCheckInsToday={priorHighIntensityCheckInsToday}
      />
    </div>
  );
}
