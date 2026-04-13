import type { ActivityRule } from "./types";

/**
 * True when this rule never awards more than 1 point (and typically 1), so we can
 * omit it from the scoring guide and fold it into “anything else”.
 */
export function isAlwaysOnePointActivityRule(rule: ActivityRule): boolean {
  switch (rule.mode) {
    case "fixed":
      if (rule.high_intensity) {
        return rule.points === 1 && rule.fallback_points === 1;
      }
      return rule.points === 1;
    case "duration_scaled":
      return (
        rule.brackets.every((b) => b.points === 1) &&
        (rule.extra_per_30min == null || rule.extra_per_30min === 0)
      );
    case "distance_scaled":
      return (
        rule.brackets.every((b) => b.points === 1) &&
        (!rule.elevation_bonus?.length ||
          rule.elevation_bonus.every((e) => e.bonus === 0))
      );
    case "conversion":
      return rule.threshold_points === 1 && rule.below_threshold_points === 1;
    default:
      return false;
  }
}
