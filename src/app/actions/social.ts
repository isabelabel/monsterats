"use server";

import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  challengeMemberships,
  checkIns,
  comments,
  reactions,
} from "@/db/schema";
import { requireSession } from "@/lib/session";

const ALLOWED_EMOJI = new Set(["💪", "🔥", "👏", "❤️", "🎉"]);

function sanitizeCommentText(raw: string): string {
  return raw.replace(/[<>]/g, "").trim().slice(0, 500);
}

async function assertCanSeeCheckIn(checkinId: string, userId: string) {
  const row = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, checkinId),
  });
  if (!row) return { ok: false as const, error: "Check-in not found." };
  const m = await db.query.challengeMemberships.findFirst({
    where: and(
      eq(challengeMemberships.challengeId, row.challengeId),
      eq(challengeMemberships.userId, userId),
    ),
  });
  if (!m) return { ok: false as const, error: "Not a member of this challenge." };
  return { ok: true as const, challengeId: row.challengeId };
}

export async function toggleReaction(checkinId: string, emoji: string) {
  const session = await requireSession();
  if (!ALLOWED_EMOJI.has(emoji)) {
    return { error: "Emoji not allowed." };
  }
  const gate = await assertCanSeeCheckIn(checkinId, session.user.id);
  if (!gate.ok) return { error: gate.error };

  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.checkinId, checkinId),
      eq(reactions.userId, session.user.id),
      eq(reactions.emoji, emoji),
    ),
  });

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
  } else {
    await db.insert(reactions).values({
      id: createId(),
      checkinId,
      userId: session.user.id,
      emoji,
    });
  }

  revalidatePath(`/challenges/${gate.challengeId}/feed`);
  return { ok: true as const };
}

export async function addComment(checkinId: string, text: string) {
  const session = await requireSession();
  const body = sanitizeCommentText(text);
  if (body.length < 1) return { error: "Comment is empty." };
  const gate = await assertCanSeeCheckIn(checkinId, session.user.id);
  if (!gate.ok) return { error: gate.error };

  await db.insert(comments).values({
    id: createId(),
    checkinId,
    userId: session.user.id,
    text: body,
  });

  revalidatePath(`/challenges/${gate.challengeId}/feed`);
  return { ok: true as const };
}
