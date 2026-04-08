import { z } from "zod";
import { activityRuleSchema } from "@/lib/scoring/types";

export const challengeImportSchema = z.object({
  challenge_name: z.string().optional(),
  duration_days: z.number().optional(),
  min_days_goal: z.number().optional(),
  max_checkins_per_day: z.number().optional(),
  min_checkin_duration_min: z.number().optional(),
  second_checkin_min_total_min: z.number().nullable().optional(),
  ranking_weights: z
    .object({
      points: z.number(),
      consistency: z.number(),
    })
    .optional(),
  activities: z.array(activityRuleSchema),
});

export type ChallengeImportPayload = z.infer<typeof challengeImportSchema>;

export const defaultRankingWeights = {
  points: 0.6,
  consistency: 0.4,
} as const;
