"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { saveAvatarFile } from "@/lib/uploads";

export async function updateProfileAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  return updateProfile(formData);
}

export async function updateProfile(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1) return { error: "Name is required." };
  const file = formData.get("avatar");
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim() || null;
  let image: string | null | undefined = session.user.image ?? undefined;
  if (avatarUrl) {
    image = avatarUrl;
  } else if (file instanceof File && file.size > 0) {
    try {
      // `saveAvatarFile` already returns a public URL (Blob https) or `/api/media/avatars/...`.
      image = await saveAvatarFile(session.user.id, file);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Avatar upload failed." };
    }
  }
  await db
    .update(user)
    .set({ name, ...(image != null ? { image } : {}) })
    .where(eq(user.id, session.user.id));
  revalidatePath("/profile");
  revalidatePath("/");
  return undefined;
}
