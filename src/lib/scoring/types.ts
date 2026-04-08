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

const fixedRuleSchema = z.object({
  name: z.string().min(1),
  mode: z.literal("fixed"),
  points: z.number(),
});

const durationScaledRuleSchema = z.object({
  name: z.string().min(1),
  mode: z.literal("duration_scaled"),
  brackets: z.array(durationBracketSchema).min(1),
  extra_per_30min: z.number().optional(),
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
