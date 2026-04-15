"use server";

import { desc, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { challengeMemberships, challenges } from "@/db/schema";
import {
  challengeImportSchema,
  defaultRankingWeights,
} from "@/lib/challenge-template";
import { getChallengeStatus } from "@/lib/challenges/status";
import { generateInviteCode } from "@/lib/invite-code";
import { requireSession } from "@/lib/session";
import { parseScoringRules } from "@/lib/scoring/types";
import {
  saveChallengeCoverFile,
  unlinkChallengeCoverFile,
} from "@/lib/uploads";
import nucelTemplateJson from "../../../public/templates/nucel.json";

function parseWeights(points: string, consistency: string) {
  const p = Number(points);
  const c = Number(consistency);
  if (!Number.isFinite(p) || !Number.isFinite(c)) return defaultRankingWeights;
  return { points: p, consistency: c };
}

type CreateOk = { id: string };
type CreateErr = { error: string };

export type CreateChallengeFormState =
  | { error: string }
  | { ok: true; id: string }
  | undefined;

async function runCreateChallenge(
  formData: FormData,
): Promise<CreateOk | CreateErr> {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Challenge name is too short." };

  const startRaw = String(formData.get("startDate") ?? "");
  const endRaw = String(formData.get("endDate") ?? "");
  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Invalid dates." };
  }
  if (endDate.getTime() <= startDate.getTime()) {
    return { error: "End must be after start." };
  }

  const timezone = String(formData.get("timezone") ?? "America/Sao_Paulo");
  const maxCheckinsPerDay = Math.max(
    1,
    Math.min(10, Number(formData.get("maxCheckinsPerDay") ?? 2) || 2),
  );
  const minCheckinDurationMin = Math.max(
    1,
    Number(formData.get("minCheckinDurationMin") ?? 30) || 30,
  );
  const secondRaw = formData.get("secondCheckinMinTotalMin");
  const secondCheckinMinTotalMin =
    secondRaw === "" || secondRaw == null
      ? null
      : (() => {
          const n = Number(secondRaw);
          return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
        })();

  let scoringRules: unknown;
  try {
    scoringRules = JSON.parse(String(formData.get("scoringRulesJson") ?? "[]"));
  } catch {
    return { error: "Invalid scoring rules JSON." };
  }
  try {
    parseScoringRules(scoringRules);
  } catch {
    return { error: "Scoring rules failed validation." };
  }

  const rankingWeights = parseWeights(
    String(formData.get("rankingPoints") ?? "0.6"),
    String(formData.get("rankingConsistency") ?? "0.4"),
  );

  const id = createId();
  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const exists = await db.query.challenges.findFirst({
      where: eq(challenges.inviteCode, inviteCode),
    });
    if (!exists) break;
    inviteCode = generateInviteCode();
  }

  let coverImageFile: string | null = null;
  const cover = formData.get("cover");
  const coverUrlRaw = String(formData.get("coverUrl") ?? "").trim() || null;
  if (coverUrlRaw) {
    coverImageFile = coverUrlRaw;
  }
  if (cover instanceof File && cover.size > 0) {
    try {
      coverImageFile = await saveChallengeCoverFile(id, cover);
    } catch (e) {
      return {
        error:
          e instanceof Error ? e.message : "Cover image upload failed.",
      };
    }
  }

  await db.insert(challenges).values({
    id,
    name,
    creatorId: session.user.id,
    startDate,
    endDate,
    inviteCode,
    maxCheckinsPerDay,
    minCheckinDurationMin,
    secondCheckinMinTotalMin,
    scoringRules: scoringRules as never,
    rankingWeights,
    timezone,
    coverImageFile,
  });

  await db.insert(challengeMemberships).values({
    userId: session.user.id,
    challengeId: id,
  });

  return { id };
}

export async function createChallenge(formData: FormData) {
  const result = await runCreateChallenge(formData);
  if ("error" in result) return result;
  revalidatePath("/");
  redirect(`/challenges/${result.id}/feed`);
}

export async function createChallengeFormAction(
  _prev: CreateChallengeFormState,
  formData: FormData,
): Promise<CreateChallengeFormState> {
  const result = await runCreateChallenge(formData);
  if ("error" in result) return { error: result.error };
  revalidatePath("/");
  revalidatePath(`/challenges/${result.id}`, "layout");
  /** Return success and let the client navigate — redirect() is unreliable here when the action is invoked via useActionState + programmatic FormData. */
  return { ok: true, id: result.id };
}

export async function updateChallenge(challengeId: string, formData: FormData) {
  const session = await requireSession();
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!ch) return { error: "Challenge not found." };
  if (ch.creatorId !== session.user.id) return { error: "Not allowed." };
  const status = getChallengeStatus(ch.startDate, ch.endDate);
  if (status !== "upcoming") {
    return { error: "Rules can only be edited before the challenge starts." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Challenge name is too short." };

  const startRaw = String(formData.get("startDate") ?? "");
  const endRaw = String(formData.get("endDate") ?? "");
  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Invalid dates." };
  }
  if (endDate.getTime() <= startDate.getTime()) {
    return { error: "End must be after start." };
  }

  const timezone = String(formData.get("timezone") ?? ch.timezone);
  const maxCheckinsPerDay = Math.max(
    1,
    Math.min(
      10,
      Number(formData.get("maxCheckinsPerDay") ?? ch.maxCheckinsPerDay) || 2,
    ),
  );
  const minCheckinDurationMin = Math.max(
    1,
    Number(formData.get("minCheckinDurationMin") ?? ch.minCheckinDurationMin) ||
      30,
  );
  const secondRaw = formData.get("secondCheckinMinTotalMin");
  const secondCheckinMinTotalMin =
    secondRaw === "" || secondRaw == null
      ? null
      : (() => {
          const n = Number(secondRaw);
          return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
        })();

  let scoringRules: unknown;
  try {
    scoringRules = JSON.parse(String(formData.get("scoringRulesJson") ?? "[]"));
  } catch {
    return { error: "Invalid scoring rules JSON." };
  }
  try {
    parseScoringRules(scoringRules);
  } catch {
    return { error: "Scoring rules failed validation." };
  }

  const rankingWeights = parseWeights(
    String(formData.get("rankingPoints") ?? String(ch.rankingWeights.points)),
    String(
      formData.get("rankingConsistency") ??
        String(ch.rankingWeights.consistency),
    ),
  );

  let coverImageFile: string | null = ch.coverImageFile ?? null;
  const cover = formData.get("cover");
  const coverUrlRaw = String(formData.get("coverUrl") ?? "").trim() || null;
  if (coverUrlRaw) {
    await unlinkChallengeCoverFile(ch.coverImageFile);
    coverImageFile = coverUrlRaw;
  }
  if (cover instanceof File && cover.size > 0) {
    try {
      const saved = await saveChallengeCoverFile(challengeId, cover);
      await unlinkChallengeCoverFile(ch.coverImageFile);
      coverImageFile = saved;
    } catch (e) {
      return {
        error:
          e instanceof Error ? e.message : "Cover image upload failed.",
      };
    }
  }

  await db
    .update(challenges)
    .set({
      name,
      startDate,
      endDate,
      timezone,
      maxCheckinsPerDay,
      minCheckinDurationMin,
      secondCheckinMinTotalMin,
      scoringRules: scoringRules as never,
      rankingWeights,
      coverImageFile,
    })
    .where(eq(challenges.id, challengeId));

  revalidatePath(`/challenges/${challengeId}`, "layout");
  revalidatePath("/");
  return { ok: true as const };
}

export async function updateChallengeFormAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const challengeId = String(formData.get("challengeId") ?? "");
  const result = await updateChallenge(challengeId, formData);
  if ("error" in result) return { error: result.error };
  return undefined;
}

/** Update cover only — allowed for the creator at any challenge status. */
export async function updateChallengeCoverFormAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const challengeId = String(formData.get("challengeId") ?? "");
  if (!challengeId) return { error: "Missing challenge." };

  const session = await requireSession();
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!ch) return { error: "Challenge not found." };
  if (ch.creatorId !== session.user.id) return { error: "Not allowed." };

  const cover = formData.get("cover");
  const coverUrlRaw = String(formData.get("coverUrl") ?? "").trim() || null;
  if (coverUrlRaw) {
    await unlinkChallengeCoverFile(ch.coverImageFile);
    await db
      .update(challenges)
      .set({ coverImageFile: coverUrlRaw })
      .where(eq(challenges.id, challengeId));
    revalidatePath(`/challenges/${challengeId}`, "layout");
    revalidatePath("/");
    redirect(`/challenges/${challengeId}/feed`);
  }
  if (!(cover instanceof File) || cover.size === 0) {
    return { error: "Choose an image file." };
  }

  try {
    const saved = await saveChallengeCoverFile(challengeId, cover);
    await unlinkChallengeCoverFile(ch.coverImageFile);
    await db
      .update(challenges)
      .set({ coverImageFile: saved })
      .where(eq(challenges.id, challengeId));
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Cover image upload failed.",
    };
  }

  revalidatePath(`/challenges/${challengeId}`, "layout");
  revalidatePath("/");
  redirect(`/challenges/${challengeId}/feed`);
}

/**
 * Appends any activities from the bundled NuCel template (`public/templates/nucel.json`)
 * that are not already in the challenge (by exact `name`). Does not remove or edit rules.
 */
export async function mergeNucelActivitiesFormAction(formData: FormData) {
  const session = await requireSession();
  const challengeId = String(formData.get("challengeId") ?? "");
  if (!challengeId) redirect("/");

  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });
  if (!ch || ch.creatorId !== session.user.id) {
    redirect("/");
  }

  const template = challengeImportSchema.parse(nucelTemplateJson);

  const existing = parseScoringRules(ch.scoringRules);
  const names = new Set(existing.map((r) => r.name));
  const merged = [...existing];
  let added = 0;
  for (const rule of template.activities) {
    if (!names.has(rule.name)) {
      merged.push(rule);
      names.add(rule.name);
      added += 1;
    }
  }

  parseScoringRules(merged);

  await db
    .update(challenges)
    .set({ scoringRules: merged as never })
    .where(eq(challenges.id, challengeId));

  revalidatePath(`/challenges/${challengeId}`, "layout");
  revalidatePath("/");
  redirect(`/challenges/${challengeId}/feed?merged=${added}`);
}

export async function listMyChallenges() {
  const session = await requireSession();
  const rows = await db
    .select({ challenge: challenges })
    .from(challengeMemberships)
    .innerJoin(
      challenges,
      eq(challengeMemberships.challengeId, challenges.id),
    )
    .where(eq(challengeMemberships.userId, session.user.id))
    .orderBy(desc(challenges.startDate));
  return rows.map((r) => r.challenge);
}
