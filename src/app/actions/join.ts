"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { challengeMemberships, challenges } from "@/db/schema";
import { getChallengeStatus } from "@/lib/challenges/status";
import { getSession, requireSession } from "@/lib/session";

export type JoinResult =
  | { ok: true; challengeId: string }
  | { ok: false; error: string };

export async function performJoin(
  userId: string,
  code: string,
): Promise<JoinResult> {
  const normalized = code.trim().toUpperCase();
  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.inviteCode, normalized),
  });
  if (!ch) return { ok: false, error: "Invalid invite code." };

  const status = getChallengeStatus(ch.startDate, ch.endDate);
  if (status === "finished") {
    return { ok: false, error: "This challenge has already finished." };
  }

  const existing = await db.query.challengeMemberships.findFirst({
    where: and(
      eq(challengeMemberships.challengeId, ch.id),
      eq(challengeMemberships.userId, userId),
    ),
  });
  if (existing) return { ok: true, challengeId: ch.id };

  await db.insert(challengeMemberships).values({
    userId,
    challengeId: ch.id,
  });

  revalidatePath("/");
  return { ok: true, challengeId: ch.id };
}

export async function joinChallengeByCode(code: string) {
  const session = await requireSession();
  const result = await performJoin(session.user.id, code);
  if (!result.ok) return { error: result.error };
  redirect(`/challenges/${result.challengeId}/feed`);
}

export async function joinFromForm(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  const code = String(formData.get("code") ?? "");
  const result = await performJoin(session.user.id, code);
  if (!result.ok) return { error: result.error };
  redirect(`/challenges/${result.challengeId}/feed`);
}
