import type { ActivityRule } from "./types";

function fmtNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

/**
 * One-line summary for compact UI (e.g. selects).
 */
export function formatActivityRuleShort(rule: ActivityRule): string {
  switch (rule.mode) {
    case "fixed":
      return `${fmtNum(rule.points)} pt per check-in`;
    case "duration_scaled": {
      const sorted = [...rule.brackets].sort((a, b) => a.up_to_min - b.up_to_min);
      const lo = sorted[0]!;
      const hi = sorted[sorted.length - 1]!;
      if (sorted.length === 1) {
        return `Up to ${fmtNum(lo.up_to_min)} min → ${fmtNum(lo.points)} pt`;
      }
      return `${fmtNum(lo.points)}–${fmtNum(hi.points)} pt by duration`;
    }
    case "distance_scaled": {
      const sorted = [...rule.brackets].sort((a, b) => a.up_to_km - b.up_to_km);
      const lo = sorted[0]!;
      const hi = sorted[sorted.length - 1]!;
      if (sorted.length === 1) {
        return `Up to ${fmtNum(lo.up_to_km)} km → ${fmtNum(lo.points)} pt`;
      }
      return `${fmtNum(lo.points)}–${fmtNum(hi.points)} pt by distance`;
    }
    case "conversion":
      return `${fmtNum(rule.threshold_points)} / ${fmtNum(rule.below_threshold_points)} pt by distance`;
    default:
      return "";
  }
}

/**
 * Human-readable lines explaining how points are computed (matches engine behavior).
 */
export function formatActivityRuleDetail(rule: ActivityRule): string[] {
  switch (rule.mode) {
    case "fixed":
      return [`Always ${fmtNum(rule.points)} points per check-in (duration does not change the score).`];

    case "duration_scaled": {
      const brackets = [...rule.brackets].sort((a, b) => a.up_to_min - b.up_to_min);
      const lines = [
        "Read the lines below in order: use the first where your duration (minutes) is at or below the cap; if longer than every cap, use the last line.",
      ];
      for (const b of brackets) {
        lines.push(`≤ ${fmtNum(b.up_to_min)} min → ${fmtNum(b.points)} points`);
      }
      const extra = rule.extra_per_30min;
      if (extra != null && extra > 0) {
        const cap = brackets[brackets.length - 1]!.up_to_min;
        lines.push(
          `After the last cap (${fmtNum(cap)} min), +${fmtNum(extra)} points per extra 30 minutes.`,
        );
      }
      return lines;
    }

    case "distance_scaled": {
      const brackets = [...rule.brackets].sort((a, b) => a.up_to_km - b.up_to_km);
      const lines = [
        "Read the lines below in order: use the first where your distance (km) is at or below the cap; if longer than every cap, the last line applies.",
      ];
      for (const b of brackets) {
        lines.push(`≤ ${fmtNum(b.up_to_km)} km → ${fmtNum(b.points)} points`);
      }
      const eb = rule.elevation_bonus;
      if (eb && eb.length > 0) {
        const sortedEb = [...eb].sort((a, b) => a.up_to_m - b.up_to_m);
        for (const row of sortedEb) {
          lines.push(
            `Elevation gain up to ${fmtNum(row.up_to_m)} m adds +${fmtNum(row.bonus)} points (uses the bracket that applies to your gain).`,
          );
        }
      }
      return lines;
    }

    case "conversion": {
      // Engine: min_distance_km wins when set; conversion_factor is ignored in that case.
      if (rule.min_distance_km != null) {
        return [
          `Reported distance ≥ ${fmtNum(rule.min_distance_km)} km → ${fmtNum(rule.threshold_points)} points; otherwise → ${fmtNum(rule.below_threshold_points)} points.`,
        ];
      }
      const f = rule.conversion_factor!;
      const equiv =
        f >= 1
          ? `indoor km ÷ ${fmtNum(f)} = outdoor-equivalent km`
          : `indoor km × ${fmtNum(f)} = outdoor-equivalent km`;
      return [
        `Distance is converted (${equiv}). If equivalent distance is at least 1 km → ${fmtNum(rule.threshold_points)} points; otherwise → ${fmtNum(rule.below_threshold_points)} points.`,
      ];
    }

    default:
      return [];
  }
}
