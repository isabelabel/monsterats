import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { challengeImportSchema } from "@/lib/challenge-template";
import { activityAllowsElevation } from "./activity-meta";
import { scoreCheckIn } from "./engine";
import { parseScoringRules } from "./types";

const fixturePath = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "nucel-template.json",
);
const fixture = challengeImportSchema.parse(
  JSON.parse(readFileSync(fixturePath, "utf-8")),
);
const rules = parseScoringRules(fixture.activities);

describe("scoreCheckIn", () => {
  it("parses NuCel fixture", () => {
    expect(rules.length).toBe(20);
  });

  it("activityAllowsElevation only for outdoor walk / run / bike", () => {
    expect(activityAllowsElevation("Caminhada")).toBe(true);
    expect(activityAllowsElevation("Corrida (rua)")).toBe(true);
    expect(activityAllowsElevation("Ciclismo (ao ar livre)")).toBe(true);
    expect(activityAllowsElevation("Corrida na esteira")).toBe(false);
    expect(activityAllowsElevation("Bike indoor")).toBe(false);
    expect(activityAllowsElevation("Musculação")).toBe(false);
    expect(activityAllowsElevation("Hyrox")).toBe(false);
  });

  it("fixed CrossFit bonus when long enough and first HI of day", () => {
    const r = scoreCheckIn(rules, "CrossFit", 45, null);
    expect(r).toEqual({ ok: true, points: 1.5 });
  });

  it("fixed CrossFit fallback when under min duration for bonus", () => {
    const r = scoreCheckIn(rules, "CrossFit", 44, null);
    expect(r).toEqual({ ok: true, points: 1.0 });
  });

  it("fixed CrossFit fallback when second high-intensity check-in that day", () => {
    const r = scoreCheckIn(rules, "CrossFit", 60, null, {
      priorHighIntensityCheckInsToday: 1,
    });
    expect(r).toEqual({ ok: true, points: 1.0 });
  });

  it("duration_scaled Yoga 30m", () => {
    const r = scoreCheckIn(rules, "Yoga", 30, null);
    expect(r).toEqual({ ok: true, points: 0.2 });
  });

  it("duration_scaled Yoga 150m with extra 30m blocks", () => {
    const r = scoreCheckIn(rules, "Yoga", 150, null);
    expect(r).toEqual({ ok: true, points: 1.75 });
  });

  it("duration_scaled intensity scales computed points", () => {
    const spinningRules = parseScoringRules([
      {
        name: "Spinning",
        mode: "duration_scaled",
        intensity_mode: "scale_by_level",
        brackets: [{ up_to_min: 60, points: 1.0 }],
        extra_per_30min: 0.3,
      },
    ]);

    const lowIntensity = scoreCheckIn(
      spinningRules,
      "Spinning",
      90,
      null,
      { intensityLevel: 1 },
    );
    expect(lowIntensity).toEqual({ ok: true, points: 1.3 });

    const midIntensity = scoreCheckIn(
      spinningRules,
      "Spinning",
      90,
      null,
      { intensityLevel: 2 },
    );
    expect(midIntensity).toEqual({ ok: true, points: 2.6 });

    const highIntensity = scoreCheckIn(
      spinningRules,
      "Spinning",
      90,
      null,
      { intensityLevel: 3 },
    );
    expect(highIntensity.ok).toBe(true);
    if (highIntensity.ok) {
      expect(highIntensity.points).toBeCloseTo(3.9, 10);
    }
  });

  it("distance_scaled street run 4km", () => {
    const r = scoreCheckIn(rules, "Corrida (rua)", 40, 4);
    expect(r).toEqual({ ok: true, points: 0.8 });
  });

  it("distance_scaled street run with elevation bonus", () => {
    const r = scoreCheckIn(rules, "Corrida (rua)", 40, 4, { elevationM: 250 });
    expect(r).toEqual({ ok: true, points: 1.1 });
  });

  it("distance_scaled cycling 25km", () => {
    const r = scoreCheckIn(rules, "Ciclismo (ao ar livre)", 90, 25);
    expect(r).toEqual({ ok: true, points: 1.0 });
  });

  it("conversion treadmill: need enough km for full point", () => {
    const low = scoreCheckIn(rules, "Corrida na esteira", 40, 1);
    expect(low).toEqual({ ok: true, points: 0.7 });
    const high = scoreCheckIn(rules, "Corrida na esteira", 40, 2);
    expect(high).toEqual({ ok: true, points: 1.0 });
  });

  it("conversion bike indoor", () => {
    const low = scoreCheckIn(rules, "Bike indoor", 30, 1);
    expect(low).toEqual({ ok: true, points: 0.7 });
    const high = scoreCheckIn(rules, "Bike indoor", 30, 1.6);
    expect(high).toEqual({ ok: true, points: 1.0 });
  });

  it("conversion elliptical min distance", () => {
    const low = scoreCheckIn(rules, "Elíptico", 45, 5);
    expect(low).toEqual({ ok: true, points: 0.7 });
    const high = scoreCheckIn(rules, "Elíptico", 45, 5.5);
    expect(high).toEqual({ ok: true, points: 1.0 });
  });

  it("conversion stairmaster min distance", () => {
    const low = scoreCheckIn(rules, "Escada (stairmaster)", 40, 5);
    expect(low).toEqual({ ok: true, points: 0.7 });
    const high = scoreCheckIn(rules, "Escada (stairmaster)", 40, 5.2);
    expect(high).toEqual({ ok: true, points: 1.0 });
  });

  it("rejects unknown activity without fallback", () => {
    const r = scoreCheckIn(rules, "Kitesurf", 60, null);
    expect(r.ok).toBe(false);
  });

  it("defaultPointsIfUnknown for unlisted activity", () => {
    const r = scoreCheckIn(rules, "Kitesurf", 60, null, {
      defaultPointsIfUnknown: 1,
    });
    expect(r).toEqual({ ok: true, points: 1 });
  });
});
