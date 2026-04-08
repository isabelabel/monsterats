import type { ActivityRule, ScoringRules } from "./types";

export function activityNeedsDistance(rule: ActivityRule): boolean {
  if (rule.mode === "distance_scaled") return true;
  if (rule.mode === "conversion") return true;
  return false;
}

/**
 * Elevation (m) is only meaningful for outdoor walk / run / bike-style activities.
 * Excludes treadmills, indoor machines, spinning, rowing, etc.
 */
export function activityAllowsElevation(activityType: string): boolean {
  const raw = activityType.trim();
  if (!raw) return false;
  const n = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  if (
    /\b(indoor|interior|esteira|elipt|stair|escada|spinning|erg|remo|row(ing)?)\b/.test(
      n,
    )
  ) {
    return false;
  }
  if (/bike\s+indoor/.test(n)) return false;

  if (/\bcaminh|walking\b|\bwalk\b/.test(n)) return true;
  if (/\bcorrida|\brun\b/.test(n)) return true;
  if (/\bbike\b|\bciclismo|\bbicicleta/.test(n)) return true;

  return false;
}

export function getActivityNames(rules: ScoringRules): string[] {
  return rules.map((r) => r.name);
}

export function findRule(
  rules: ScoringRules,
  name: string,
): ActivityRule | undefined {
  return rules.find((r) => r.name === name);
}
