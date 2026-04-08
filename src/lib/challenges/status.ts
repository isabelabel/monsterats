export type ChallengeStatus = "upcoming" | "active" | "finished";

export function getChallengeStatus(
  start: Date,
  end: Date,
  now: Date = new Date(),
): ChallengeStatus {
  if (now.getTime() < start.getTime()) return "upcoming";
  if (now.getTime() > end.getTime()) return "finished";
  return "active";
}
