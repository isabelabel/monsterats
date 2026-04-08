import { customAlphabet } from "nanoid";

const alphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export function generateInviteCode(): string {
  return alphabet();
}
