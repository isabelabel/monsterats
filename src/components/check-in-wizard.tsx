"use client";

import { useActionState, useMemo, useState } from "react";
import { createCheckInFormAction } from "@/app/actions/checkins";
import { formatActivityRuleDetail } from "@/lib/scoring/describe-rule";
import { DEFAULT_OTHER_ACTIVITY_POINTS, scoreCheckIn } from "@/lib/scoring/engine";
import {
  activityAllowsElevation,
  activityNeedsDistance,
  findRule,
} from "@/lib/scoring/activity-meta";
import type { ScoringRules } from "@/lib/scoring/types";

/** Select value for “activity not in the list”. */
export const OTHER_ACTIVITY_VALUE = "__monsterats_other__";

export function CheckInWizard({
  challengeId,
  scoringRules,
}: {
  challengeId: string;
  scoringRules: ScoringRules;
}) {
  const [state, submitAction, pending] = useActionState(
    createCheckInFormAction,
    undefined,
  );
  const [step, setStep] = useState(0);
  const [activityChoice, setActivityChoice] = useState<string>(() =>
    scoringRules[0]?.name ?? OTHER_ACTIVITY_VALUE,
  );
  const [otherLabel, setOtherLabel] = useState("");
  const [durationMin, setDurationMin] = useState(45);
  const [distanceKm, setDistanceKm] = useState("");
  const [elevationM, setElevationM] = useState("");
  const [description, setDescription] = useState("");

  const resolvedActivityType = useMemo(() => {
    if (activityChoice === OTHER_ACTIVITY_VALUE) {
      return otherLabel.trim();
    }
    return activityChoice;
  }, [activityChoice, otherLabel]);

  const rule = findRule(scoringRules, resolvedActivityType);
  const needsDistance = rule ? activityNeedsDistance(rule) : false;
  const showElevation = activityAllowsElevation(resolvedActivityType);

  const canNext0 =
    activityChoice === OTHER_ACTIVITY_VALUE
      ? otherLabel.trim().length >= 2
      : activityChoice.length > 0;

  const elevNum =
    elevationM === "" ? null : Number(elevationM);
  const elevOk =
    !showElevation ||
    elevationM === "" ||
    (Number.isFinite(elevNum) && elevNum! >= 0);

  const canNext1 =
    Number.isFinite(durationMin) &&
    durationMin >= 1 &&
    (!needsDistance ||
      (distanceKm !== "" && !Number.isNaN(Number(distanceKm)))) &&
    elevOk;

  const selectedListedRule =
    activityChoice !== OTHER_ACTIVITY_VALUE
      ? findRule(scoringRules, activityChoice)
      : undefined;

  const scorePreview = useMemo(() => {
    if (!Number.isFinite(durationMin) || durationMin < 1) return null;
    if (needsDistance && (distanceKm === "" || Number.isNaN(Number(distanceKm)))) {
      return null;
    }
    if (!elevOk) return null;
    const distParsed = needsDistance ? Number(distanceKm) : undefined;
    const elevForScore =
      showElevation && elevationM !== "" && Number.isFinite(elevNum) && elevNum! >= 0
        ? elevNum
        : null;
    return scoreCheckIn(
      scoringRules,
      resolvedActivityType,
      durationMin,
      distParsed,
      {
        elevationM: elevForScore,
        defaultPointsIfUnknown: DEFAULT_OTHER_ACTIVITY_POINTS,
      },
    );
  }, [
    scoringRules,
    resolvedActivityType,
    durationMin,
    distanceKm,
    needsDistance,
    showElevation,
    elevationM,
    elevNum,
    elevOk,
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="text-muted mb-6 flex items-center justify-center gap-2 text-xs font-medium">
        {["Activity", "Details", "Photo"].map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-border w-6 text-center opacity-60">·</span>
            )}
            <span
              className={
                i === step
                  ? "bg-accent/12 text-accent rounded-full px-3 py-1"
                  : "px-3 py-1"
              }
            >
              {label}
            </span>
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="ui-surface space-y-5 p-6">
          <label className="block">
            <span className="text-muted mb-2 block text-sm font-medium">
              Activity
            </span>
            <select
              className="ui-input text-foreground w-full"
              value={activityChoice}
              onChange={(e) => setActivityChoice(e.target.value)}
            >
              {scoringRules.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
              <option value={OTHER_ACTIVITY_VALUE}>
                Outro / Other (not listed)
              </option>
            </select>
          </label>
          {selectedListedRule && (
            <div className="bg-muted/40 space-y-1.5 rounded-xl px-3 py-3">
              <ul className="text-muted list-disc space-y-1 pl-4 text-xs leading-relaxed">
                {formatActivityRuleDetail(selectedListedRule).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {activityChoice === OTHER_ACTIVITY_VALUE && (
            <label className="block">
              <span className="text-muted mb-2 block text-sm font-medium">
                Describe the activity
              </span>
              <input
                className="ui-input text-foreground w-full"
                placeholder="e.g. Beach volleyball, HIIT class…"
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                maxLength={120}
              />
              <p className="text-muted mt-2 text-xs leading-relaxed">
                Not in the challenge list — scores{" "}
                <strong className="text-foreground">
                  {DEFAULT_OTHER_ACTIVITY_POINTS} pt
                </strong>{" "}
                (fixed).
              </p>
            </label>
          )}
          <button
            type="button"
            className="ui-btn-primary w-full disabled:opacity-40"
            disabled={!canNext0}
            onClick={() => setStep(1)}
          >
            Next
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="ui-surface space-y-5 p-6">
          <p className="text-muted text-sm">
            <span className="text-foreground font-medium">
              {resolvedActivityType}
            </span>
          </p>
          <label className="block">
            <span className="text-muted mb-2 block text-sm font-medium">
              Duration (minutes)
            </span>
            <input
              type="number"
              min={1}
              className="ui-input w-full"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </label>
          {needsDistance && (
            <label className="block">
              <span className="text-muted mb-2 block text-sm font-medium">
                Distance (km)
              </span>
              <input
                type="number"
                step="0.1"
                min={0}
                className="ui-input w-full"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
              />
            </label>
          )}
          {showElevation && (
            <label className="block">
              <span className="text-muted mb-2 block text-sm font-medium">
                Elevation gain (m, optional)
              </span>
              <input
                type="number"
                step="1"
                min={0}
                className="ui-input w-full"
                value={elevationM}
                onChange={(e) => setElevationM(e.target.value)}
                placeholder="e.g. 120 — adds bonus per challenge rules"
              />
            </label>
          )}
          <label className="block">
            <span className="text-muted mb-2 block text-sm font-medium">
              Notes (optional)
            </span>
            <textarea
              className="ui-input min-h-[88px] w-full resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {scorePreview && (
            <p
              className={
                scorePreview.ok
                  ? "text-accent text-sm font-semibold tabular-nums"
                  : "text-sm text-red-700"
              }
            >
              {scorePreview.ok
                ? `Estimated score: ${scorePreview.points} pts`
                : scorePreview.error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              className="ui-btn-secondary flex-1"
              onClick={() => setStep(0)}
            >
              Back
            </button>
            <button
              type="button"
              className="ui-btn-primary flex-1 disabled:opacity-40"
              disabled={!canNext1}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form action={submitAction} className="ui-surface space-y-5 p-6">
          <input type="hidden" name="challengeId" value={challengeId} />
          <input type="hidden" name="activityType" value={resolvedActivityType} />
          <input type="hidden" name="durationMin" value={String(durationMin)} />
          <input
            type="hidden"
            name="distanceKm"
            value={needsDistance ? distanceKm : ""}
          />
          <input
            type="hidden"
            name="elevationM"
            value={
              showElevation && elevationM !== "" && Number.isFinite(elevNum)
                ? String(elevNum)
                : ""
            }
          />
          <input type="hidden" name="description" value={description} />
          {state?.error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {state.error}
            </p>
          )}
          <label className="block">
            <span className="text-muted mb-2 block text-sm font-medium">
              Photo proof (camera or gallery)
            </span>
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              required
              className="text-muted w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-900"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              className="ui-btn-secondary flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={pending}
              className="ui-btn-primary flex-1 disabled:opacity-50"
            >
              {pending ? "Submitting…" : "Submit check-in"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
