import { z } from "zod";

const durationBracketSchema = z.object({
  up_to_min: z.number().positive(),
  points: z.number(),
});

const distanceBracketSchema = z.object({
  up_to_km: z.number().positive(),
  points: z.number(),
});

const elevationBonusBracketSchema = z.object({
  up_to_m: z.number().positive(),
  bonus: z.number(),
});

const fixedRuleSchema = z
  .object({
    name: z.string().min(1),
    mode: z.literal("fixed"),
    points: z.number(),
    high_intensity: z.boolean().optional(),
    min_duration_for_bonus_min: z.number().positive().optional(),
    fallback_points: z.number().optional(),
  })
  .superRefine((r, ctx) => {
    if (r.high_intensity) {
      if (r.min_duration_for_bonus_min == null) {
        ctx.addIssue({
          code: "custom",
          message:
            "high_intensity activities require min_duration_for_bonus_min",
          path: ["min_duration_for_bonus_min"],
        });
      }
      if (r.fallback_points == null) {
        ctx.addIssue({
          code: "custom",
          message: "high_intensity activities require fallback_points",
          path: ["fallback_points"],
        });
      }
    } else if (
      r.min_duration_for_bonus_min != null ||
      r.fallback_points != null
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "min_duration_for_bonus_min and fallback_points are only valid with high_intensity: true",
        path: ["high_intensity"],
      });
    }
  });

const durationScaledRuleSchema = z.object({
  name: z.string().min(1),
  mode: z.literal("duration_scaled"),
  brackets: z.array(durationBracketSchema).min(1),
  extra_per_30min: z.number().optional(),
  /**
   * When set, the check-in UI will ask the user to provide an intensity
   * level (1/2/3). The computed duration-scaled points are multiplied by
   * that intensity.
   */
  intensity_mode: z.literal("scale_by_level").optional(),
});

const distanceScaledRuleSchema = z.object({
  name: z.string().min(1),
  mode: z.literal("distance_scaled"),
  brackets: z.array(distanceBracketSchema).min(1),
  elevation_bonus: z.array(elevationBonusBracketSchema).min(1).optional(),
});

const conversionRuleSchema = z
  .object({
    name: z.string().min(1),
    mode: z.literal("conversion"),
    conversion_factor: z.number().positive().optional(),
    min_distance_km: z.number().positive().optional(),
    threshold_points: z.number(),
    below_threshold_points: z.number(),
  })
  .refine(
    (r) => r.conversion_factor != null || r.min_distance_km != null,
    "conversion activity needs conversion_factor and/or min_distance_km",
  );

export const activityRuleSchema = z.union([
  fixedRuleSchema,
  durationScaledRuleSchema,
  distanceScaledRuleSchema,
  conversionRuleSchema,
]);

export type ActivityRule = z.infer<typeof activityRuleSchema>;
export type ScoringRules = ActivityRule[];

export function parseScoringRules(raw: unknown): ScoringRules {
  return z.array(activityRuleSchema).parse(raw);
}

export function findRuleByName(
  rules: ScoringRules,
  activityName: string,
): ActivityRule | undefined {
  return rules.find((r) => r.name === activityName);
}

export function isHighIntensityFixedActivity(
  rules: ScoringRules,
  activityType: string,
): boolean {
  const r = findRuleByName(rules, activityType);
  return r?.mode === "fixed" && r.high_intensity === true;
}

/** How many check-ins use a high_intensity fixed activity (for one-per-day caps). */
export function countHighIntensityCheckIns(
  rules: ScoringRules,
  rows: { activityType: string }[],
): number {
  return rows.filter((c) => isHighIntensityFixedActivity(rules, c.activityType))
    .length;
}
