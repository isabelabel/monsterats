import type { ActivityRule, ScoringRules } from "./types";
import { findRuleByName } from "./types";

export type ScoreResult =
  | { ok: true; points: number }
  | { ok: false; error: string };

const OUTDOOR_FULL_CREDIT_KM = 1;

function durationScaled(
  rule: Extract<ActivityRule, { mode: "duration_scaled" }>,
  durationMin: number,
): number {
  const brackets = [...rule.brackets].sort((a, b) => a.up_to_min - b.up_to_min);
  let chosen = brackets[0]!;
  for (const b of brackets) {
    if (durationMin <= b.up_to_min) {
      chosen = b;
      break;
    }
    chosen = b;
  }
  let points = chosen.points;
  const cap = chosen.up_to_min;
  const extra = rule.extra_per_30min ?? 0;
  if (extra > 0 && durationMin > cap) {
    const extraBlocks = Math.floor((durationMin - cap) / 30);
    points += extraBlocks * extra;
  }
  return points;
}

function elevationBonusFromBrackets(
  brackets: { up_to_m: number; bonus: number }[],
  elevationM: number,
): number {
  const sorted = [...brackets].sort((a, b) => a.up_to_m - b.up_to_m);
  let chosen = sorted[0]!;
  for (const b of sorted) {
    if (elevationM <= b.up_to_m) {
      chosen = b;
      break;
    }
    chosen = b;
  }
  return chosen.bonus;
}

function distanceScaled(
  rule: Extract<ActivityRule, { mode: "distance_scaled" }>,
  distanceKm: number,
  elevationM: number | null | undefined,
): number {
  const brackets = [...rule.brackets].sort((a, b) => a.up_to_km - b.up_to_km);
  let chosen = brackets[0]!;
  for (const b of brackets) {
    if (distanceKm <= b.up_to_km) {
      chosen = b;
      break;
    }
    chosen = b;
  }
  let points = chosen.points;
  const cap = chosen.up_to_km;
  if (distanceKm > cap) {
    // No extra_per_km in spec — use last bracket points only
    points = chosen.points;
  }
  const eb = rule.elevation_bonus;
  if (
    eb &&
    eb.length > 0 &&
    elevationM != null &&
    Number.isFinite(elevationM) &&
    elevationM > 0
  ) {
    points += elevationBonusFromBrackets(eb, elevationM);
  }
  return points;
}

/**
 * conversion_factor > 1: indoor km / factor = outdoor equivalent (e.g. bike 1.6 → 1 km).
 * conversion_factor < 1: indoor km * factor = outdoor equivalent (treadmill run).
 * min_distance_km: full credit if reported distance >= threshold.
 */
function conversionMode(
  rule: Extract<ActivityRule, { mode: "conversion" }>,
  distanceKm: number,
): number {
  if (rule.min_distance_km != null) {
    return distanceKm >= rule.min_distance_km
      ? rule.threshold_points
      : rule.below_threshold_points;
  }
  const f = rule.conversion_factor;
  if (f == null) {
    return rule.below_threshold_points;
  }
  const outdoorEquiv = f >= 1 ? distanceKm / f : distanceKm * f;
  return outdoorEquiv >= OUTDOOR_FULL_CREDIT_KM
    ? rule.threshold_points
    : rule.below_threshold_points;
}

/** Points for activities not in the challenge list (“Other”). */
export const DEFAULT_OTHER_ACTIVITY_POINTS = 1;

export type ScoreCheckInOptions = {
  /** When set, unknown activity names score this many points (no distance rules). */
  defaultPointsIfUnknown?: number;
  /** Elevation gain in meters (optional); used with `elevation_bonus` on distance_scaled rules. */
  elevationM?: number | null;
};

export function scoreCheckIn(
  rules: ScoringRules,
  activityName: string,
  durationMin: number,
  distanceKm: number | null | undefined,
  opts?: ScoreCheckInOptions,
): ScoreResult {
  const rule = findRuleByName(rules, activityName);
  if (!rule) {
    const fallback = opts?.defaultPointsIfUnknown;
    if (fallback != null && Number.isFinite(fallback) && fallback >= 0) {
      return { ok: true, points: fallback };
    }
    return { ok: false, error: "Unknown activity for this challenge." };
  }

  switch (rule.mode) {
    case "fixed":
      return { ok: true, points: rule.points };
    case "duration_scaled":
      return { ok: true, points: durationScaled(rule, durationMin) };
    case "distance_scaled": {
      if (distanceKm == null || Number.isNaN(distanceKm)) {
        return { ok: false, error: "Distance is required for this activity." };
      }
      return {
        ok: true,
        points: distanceScaled(rule, distanceKm, opts?.elevationM),
      };
    }
    case "conversion": {
      if (distanceKm == null || Number.isNaN(distanceKm)) {
        return {
          ok: false,
          error: "Distance is required for this activity.",
        };
      }
      return { ok: true, points: conversionMode(rule, distanceKm) };
    }
  }
}
