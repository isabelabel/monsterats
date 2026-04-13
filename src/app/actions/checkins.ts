"use server";

import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  challengeMemberships,
  challenges,
  checkIns,
} from "@/db/schema";
import { dateKeyInTimezone } from "@/lib/dates";
import { getChallengeStatus } from "@/lib/challenges/status";
import { requireSession } from "@/lib/session";
import {
  DEFAULT_OTHER_ACTIVITY_POINTS,
  type ScoreCheckInOptions,
  scoreCheckIn,
} from "@/lib/scoring/engine";
import { activityAllowsElevation } from "@/lib/scoring/activity-meta";
import {
  countHighIntensityCheckIns,
  findRuleByName,
  parseScoringRules,
} from "@/lib/scoring/types";
import { saveCheckinPhoto, unlinkCheckinPhotoByUrl } from "@/lib/uploads";

async function runCreateCheckIn(
  challengeId: string,
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const session = await requireSession();
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!ch) return { error: "Challenge not found." };

  const member = await db.query.challengeMemberships.findFirst({
    where: and(
      eq(challengeMemberships.challengeId, challengeId),
      eq(challengeMemberships.userId, session.user.id),
    ),
  });
  if (!member) return { error: "Join this challenge first." };

  const status = getChallengeStatus(ch.startDate, ch.endDate);
  if (status !== "active") {
    return {
      error: "Check-ins are only allowed while the challenge is active.",
    };
  }

  const activityType = String(formData.get("activityType") ?? "").trim();
  const durationMin = Number(formData.get("durationMin") ?? 0);
  const distanceRaw = formData.get("distanceKm");
  const distanceKm =
    distanceRaw === "" || distanceRaw == null ? null : Number(distanceRaw);
  const elevationRaw = formData.get("elevationM");
  const elevationM =
    elevationRaw === "" || elevationRaw == null
      ? null
      : Number(elevationRaw);
  const description = String(formData.get("description") ?? "").trim() || null;
  const photo = formData.get("photo");

  if (!activityType) return { error: "Pick an activity." };
  if (activityType.length > 120) {
    return { error: "Activity name is too long." };
  }
  if (!Number.isFinite(durationMin) || durationMin < 1) {
    return { error: "Duration must be a positive number (minutes)." };
  }
  if (
    elevationM != null &&
    (!Number.isFinite(elevationM) || elevationM < 0 || elevationM > 20000)
  ) {
    return { error: "Elevation must be between 0 and 20000 m if provided." };
  }
  if (
    elevationM != null &&
    Number.isFinite(elevationM) &&
    elevationM > 0 &&
    !activityAllowsElevation(activityType)
  ) {
    return {
      error:
        "Elevation is only for outdoor walking, running, or cycling-style activities.",
    };
  }
  if (durationMin < ch.minCheckinDurationMin) {
    return {
      error: `Minimum duration is ${ch.minCheckinDurationMin} minutes.`,
    };
  }

  let rules;
  try {
    rules = parseScoringRules(ch.scoringRules);
  } catch {
    return { error: "Challenge scoring rules are invalid." };
  }

  const now = new Date();
  const tz = ch.timezone;
  const todayKey = dateKeyInTimezone(now, tz);

  const myCheckIns = await db.query.checkIns.findMany({
    where: and(
      eq(checkIns.challengeId, challengeId),
      eq(checkIns.userId, session.user.id),
    ),
  });

  const todayCheckIns = myCheckIns.filter(
    (c) => dateKeyInTimezone(new Date(c.createdAt), tz) === todayKey,
  );

  if (todayCheckIns.length >= ch.maxCheckinsPerDay) {
    return { error: "Daily check-in limit reached." };
  }

  const nextCount = todayCheckIns.length + 1;
  if (
    nextCount === 2 &&
    ch.secondCheckinMinTotalMin != null &&
    ch.secondCheckinMinTotalMin > 0
  ) {
    const totalDuration =
      todayCheckIns.reduce((s, c) => s + c.durationMin, 0) + durationMin;
    if (totalDuration < ch.secondCheckinMinTotalMin) {
      return {
        error: `Second check-in needs at least ${ch.secondCheckinMinTotalMin} total minutes that day (currently ${totalDuration}).`,
      };
    }
  }

  const priorHighIntensityCheckInsToday = countHighIntensityCheckIns(
    rules,
    todayCheckIns,
  );

  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Photo proof is required." };
  }

  const listed = findRuleByName(rules, activityType);
  if (!listed && activityType.trim().length < 2) {
    return {
      error: "For “Other”, type a short activity name (at least 2 characters).",
    };
  }
  const scoreOpts: ScoreCheckInOptions = {
    ...(elevationM != null &&
    Number.isFinite(elevationM) &&
    elevationM > 0 &&
    activityAllowsElevation(activityType)
      ? { elevationM }
      : {}),
    priorHighIntensityCheckInsToday,
  };
  const scored = listed
    ? scoreCheckIn(rules, activityType, durationMin, distanceKm, scoreOpts)
    : scoreCheckIn(rules, activityType, durationMin, null, {
        defaultPointsIfUnknown: DEFAULT_OTHER_ACTIVITY_POINTS,
      });
  if (!scored.ok) return { error: scored.error };

  let photoUrl: string;
  try {
    photoUrl = await saveCheckinPhoto(photo);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Photo upload failed." };
  }
  const id = createId();

  await db.insert(checkIns).values({
    id,
    userId: session.user.id,
    challengeId,
    activityType,
    durationMin,
    distanceKm: distanceKm ?? null,
    elevationM: elevationM ?? null,
    photoUrl,
    description,
    pointsEarned: scored.points,
  });

  return { ok: true };
}

export async function createCheckIn(challengeId: string, formData: FormData) {
  const result = await runCreateCheckIn(challengeId, formData);
  if ("error" in result) return result;
  revalidatePath(`/challenges/${challengeId}/feed`);
  revalidatePath(`/challenges/${challengeId}/leaderboard`);
  redirect(`/challenges/${challengeId}/feed`);
}

export async function createCheckInFormAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const challengeId = String(formData.get("challengeId") ?? "");
  if (!challengeId) return { error: "Missing challenge." };
  const result = await runCreateCheckIn(challengeId, formData);
  if ("error" in result) return { error: result.error };
  revalidatePath(`/challenges/${challengeId}/feed`);
  revalidatePath(`/challenges/${challengeId}/leaderboard`);
  redirect(`/challenges/${challengeId}/feed`);
}

export async function deleteCheckIn(checkInId: string) {
  const session = await requireSession();
  const row = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, checkInId),
  });
  if (!row) return { error: "Check-in not found." };
  if (row.userId !== session.user.id) {
    return { error: "You can only delete your own check-ins." };
  }

  await unlinkCheckinPhotoByUrl(row.photoUrl);
  await db.delete(checkIns).where(eq(checkIns.id, checkInId));

  revalidatePath(`/challenges/${row.challengeId}/feed`);
  revalidatePath(`/challenges/${row.challengeId}/leaderboard`);
  revalidatePath(`/challenges/${row.challengeId}`, "layout");
  return { ok: true as const };
}
