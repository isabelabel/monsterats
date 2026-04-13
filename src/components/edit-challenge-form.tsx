"use client";

import { useActionState, useCallback, useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import { updateChallengeFormAction } from "@/app/actions/challenges";
import { challenges } from "@/db/schema";
import { challengeImportSchema } from "@/lib/challenge-template";
import { toDatetimeLocalValue } from "@/lib/datetime-form";
import { resolveChallengeCoverUrl } from "@/lib/media-url";
import { parseScoringRules } from "@/lib/scoring/types";

type Challenge = InferSelectModel<typeof challenges>;

export function EditChallengeForm({ challenge }: { challenge: Challenge }) {
  const [state, formAction, pending] = useActionState(
    updateChallengeFormAction,
    undefined,
  );

  const [name, setName] = useState(challenge.name);
  const [startStr, setStartStr] = useState(
    toDatetimeLocalValue(new Date(challenge.startDate)),
  );
  const [endStr, setEndStr] = useState(
    toDatetimeLocalValue(new Date(challenge.endDate)),
  );
  const [timezone, setTimezone] = useState(challenge.timezone);
  const [scoringJson, setScoringJson] = useState(
    JSON.stringify(challenge.scoringRules, null, 2),
  );
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [maxCheckinsPerDay, setMaxCheckinsPerDay] = useState(
    challenge.maxCheckinsPerDay,
  );
  const [minCheckinDurationMin, setMinCheckinDurationMin] = useState(
    challenge.minCheckinDurationMin,
  );
  const [secondCheckinMinTotalMin, setSecondCheckinMinTotalMin] = useState(
    challenge.secondCheckinMinTotalMin != null
      ? String(challenge.secondCheckinMinTotalMin)
      : "",
  );
  const [rankingPoints, setRankingPoints] = useState(
    String(challenge.rankingWeights.points),
  );
  const [rankingConsistency, setRankingConsistency] = useState(
    String(challenge.rankingWeights.consistency),
  );
  const [importPaste, setImportPaste] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const validateRules = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      parseScoringRules(parsed);
      setRulesError(null);
    } catch (e) {
      setRulesError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, []);

  const applyPasteImport = useCallback(() => {
    setImportError(null);
    try {
      const data = JSON.parse(importPaste);
      const t = challengeImportSchema.parse(data);
      setScoringJson(JSON.stringify(t.activities, null, 2));
      if (t.max_checkins_per_day != null)
        setMaxCheckinsPerDay(t.max_checkins_per_day);
      if (t.min_checkin_duration_min != null)
        setMinCheckinDurationMin(t.min_checkin_duration_min);
      if (t.second_checkin_min_total_min != null)
        setSecondCheckinMinTotalMin(
          String(t.second_checkin_min_total_min ?? ""),
        );
      if (t.ranking_weights) {
        setRankingPoints(String(t.ranking_weights.points));
        setRankingConsistency(String(t.ranking_weights.consistency));
      }
      setRulesError(null);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Invalid import JSON.");
    }
  }, [importPaste]);

  const coverPreview = resolveChallengeCoverUrl(challenge.coverImageFile);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="ui-surface mx-4 mt-4 max-w-lg space-y-4 p-6 sm:mx-auto sm:p-7"
    >
      <input type="hidden" name="challengeId" value={challenge.id} />
      {state?.error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="text-muted mb-1.5 block text-sm font-medium">
          Cover image
        </span>
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPreview}
            alt=""
            className="border-border mb-2 aspect-[2/1] w-full rounded-xl border object-cover"
          />
        ) : null}
        <input
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp"
          className="text-muted w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-900"
        />
        <span className="text-muted mt-1 block text-xs">
          Leave empty to keep the current cover. JPEG, PNG, or WebP, up to 10MB.
        </span>
      </label>
      <label className="block">
        <span className="text-muted mb-1 block text-sm font-medium">Name</span>
        <input
          name="name"
          className="ui-input w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-muted mb-1 block text-sm font-medium">Start</span>
        <input
          type="datetime-local"
          name="startDate"
          className="ui-input w-full"
          value={startStr}
          onChange={(e) => setStartStr(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-muted mb-1 block text-sm font-medium">End</span>
        <input
          type="datetime-local"
          name="endDate"
          className="ui-input w-full"
          value={endStr}
          onChange={(e) => setEndStr(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-muted mb-1 block text-sm font-medium">
          Timezone
        </span>
        <select
          name="timezone"
          className="ui-input w-full"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          <option value="America/Sao_Paulo">America/Sao_Paulo</option>
          <option value="America/Fortaleza">America/Fortaleza</option>
          <option value="Europe/Lisbon">Europe/Lisbon</option>
          <option value="UTC">UTC</option>
        </select>
      </label>
      <div>
        <span className="text-muted mb-1 block text-sm font-medium">
          Paste import JSON
        </span>
        <textarea
          className="ui-input mb-2 min-h-[60px] w-full font-mono text-xs"
          value={importPaste}
          onChange={(e) => setImportPaste(e.target.value)}
        />
        <button
          type="button"
          className="text-accent text-sm underline"
          onClick={applyPasteImport}
        >
          Apply import
        </button>
        {importError && (
          <p className="mt-2 text-sm text-red-800">{importError}</p>
        )}
      </div>
      <label className="block">
        <span className="text-muted mb-1 block text-sm font-medium">
          Scoring rules JSON
        </span>
        <textarea
          name="scoringRulesJson"
          className="ui-input min-h-[200px] w-full font-mono text-xs"
          value={scoringJson}
          onChange={(e) => {
            setScoringJson(e.target.value);
            validateRules(e.target.value);
          }}
        />
        {rulesError && (
          <p className="mt-2 text-sm text-red-800">{rulesError}</p>
        )}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="text-muted text-xs">Max / day</span>
          <input
            type="number"
            name="maxCheckinsPerDay"
            min={1}
            max={10}
            className="ui-input mt-1 w-full"
            value={maxCheckinsPerDay}
            onChange={(e) => setMaxCheckinsPerDay(Number(e.target.value))}
          />
        </label>
        <label>
          <span className="text-muted text-xs">Min min</span>
          <input
            type="number"
            name="minCheckinDurationMin"
            min={1}
            className="ui-input mt-1 w-full"
            value={minCheckinDurationMin}
            onChange={(e) => setMinCheckinDurationMin(Number(e.target.value))}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-muted text-xs">2nd check-in min daily total (empty = off)</span>
        <input
          type="number"
          name="secondCheckinMinTotalMin"
          className="ui-input mt-1 w-full"
          value={secondCheckinMinTotalMin}
          onChange={(e) => setSecondCheckinMinTotalMin(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="text-muted text-xs">Weight points</span>
          <input
            name="rankingPoints"
            className="ui-input mt-1 w-full"
            value={rankingPoints}
            onChange={(e) => setRankingPoints(e.target.value)}
          />
        </label>
        <label>
          <span className="text-muted text-xs">Weight consistency</span>
          <input
            name="rankingConsistency"
            className="ui-input mt-1 w-full"
            value={rankingConsistency}
            onChange={(e) => setRankingConsistency(e.target.value)}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending || !!rulesError}
        className="ui-btn-primary w-full disabled:opacity-40"
      >
        Save changes
      </button>
    </form>
  );
}
