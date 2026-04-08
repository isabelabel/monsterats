"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  createChallengeFormAction,
  type CreateChallengeFormState,
} from "@/app/actions/challenges";
import { challengeImportSchema } from "@/lib/challenge-template";
import { toDatetimeLocalValue } from "@/lib/datetime-form";
import { parseScoringRules } from "@/lib/scoring/types";

const SIMPLE_PRESET = JSON.stringify([
  { name: "Workout", mode: "fixed", points: 1 },
]);

function defaultStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  return d;
}

function defaultEnd(): Date {
  const d = defaultStart();
  d.setDate(d.getDate() + 40);
  return d;
}

export function ChallengeWizard() {
  const router = useRouter();
  const [formState, dispatchCreate, createPending] = useActionState<
    CreateChallengeFormState,
    FormData
  >(createChallengeFormAction, undefined);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [startStr, setStartStr] = useState(toDatetimeLocalValue(defaultStart()));
  const [endStr, setEndStr] = useState(toDatetimeLocalValue(defaultEnd()));
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [scoringJson, setScoringJson] = useState(SIMPLE_PRESET);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [maxCheckinsPerDay, setMaxCheckinsPerDay] = useState(2);
  const [minCheckinDurationMin, setMinCheckinDurationMin] = useState(30);
  const [secondCheckinMinTotalMin, setSecondCheckinMinTotalMin] = useState("90");
  const [rankingPoints, setRankingPoints] = useState("0.6");
  const [rankingConsistency, setRankingConsistency] = useState("0.4");
  const [importPaste, setImportPaste] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverObjectUrlRef = useRef<string | null>(null);
  const coverFileRef = useRef<File | null>(null);

  const onCoverFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
        coverObjectUrlRef.current = null;
      }
      const f = e.target.files?.[0] ?? null;
      coverFileRef.current = f;
      if (f) {
        const url = URL.createObjectURL(f);
        coverObjectUrlRef.current = url;
        setCoverPreview(url);
      } else {
        setCoverPreview(null);
      }
    },
    [],
  );

  const onCreateSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const c = coverFileRef.current;
      if (c) fd.set("cover", c);
      dispatchCreate(fd);
    },
    [dispatchCreate],
  );

  useEffect(() => {
    return () => {
      if (coverObjectUrlRef.current) {
        URL.revokeObjectURL(coverObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (formState && "ok" in formState && formState.ok) {
      router.push(`/challenges/${formState.id}/feed`);
      router.refresh();
    }
  }, [formState, router]);

  const validateRules = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      parseScoringRules(parsed);
      setRulesError(null);
      return true;
    } catch (e) {
      setRulesError(e instanceof Error ? e.message : "Invalid JSON");
      return false;
    }
  }, []);

  const applyNucelTemplate = useCallback(async () => {
    try {
      const res = await fetch("/templates/nucel.json", { cache: "no-store" });
      const data = await res.json();
      const t = challengeImportSchema.parse(data);
      setScoringJson(JSON.stringify(t.activities));
      if (t.max_checkins_per_day != null)
        setMaxCheckinsPerDay(t.max_checkins_per_day);
      if (t.min_checkin_duration_min != null)
        setMinCheckinDurationMin(t.min_checkin_duration_min);
      if (t.second_checkin_min_total_min != null)
        setSecondCheckinMinTotalMin(String(t.second_checkin_min_total_min));
      if (t.ranking_weights) {
        setRankingPoints(String(t.ranking_weights.points));
        setRankingConsistency(String(t.ranking_weights.consistency));
      }
      setRulesError(null);
    } catch (e) {
      setRulesError(
        e instanceof Error ? e.message : "Could not load NuCel template.",
      );
    }
  }, []);

  const applyPasteImport = useCallback(() => {
    setImportError(null);
    try {
      const data = JSON.parse(importPaste);
      const t = challengeImportSchema.parse(data);
      setScoringJson(JSON.stringify(t.activities));
      if (t.challenge_name) setName(t.challenge_name);
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

  const activityCount = useMemo(() => {
    try {
      return (JSON.parse(scoringJson) as unknown[]).length;
    } catch {
      return 0;
    }
  }, [scoringJson]);

  const canNext0 = name.trim().length >= 2 && startStr && endStr;
  const canNext1 = !rulesError && activityCount > 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-muted mb-8 flex flex-wrap gap-2 text-xs font-medium">
        {["Basics", "Scoring", "Limits", "Review"].map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 transition ${
              i === step
                ? "bg-violet-100 text-violet-900"
                : "bg-zinc-100/80 text-zinc-500"
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="ui-surface mb-4 space-y-3 p-5">
        <div>
          <span className="text-muted text-sm font-medium">
            Cover image (optional)
          </span>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Choose a wide banner for the challenge header (e.g. 2:1). It is
            saved when you tap <strong>Create challenge</strong> on the last
            step (you can change it here anytime before that).
          </p>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onCoverFileChange}
          className="text-muted w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-900"
        />
        <span className="text-muted block text-xs">
          JPEG, PNG, or WebP, up to 10MB.
        </span>
        {coverPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPreview}
            alt=""
            className="aspect-[2/1] w-full rounded-xl border border-zinc-200/80 object-cover"
          />
        ) : null}
      </div>

      {step === 0 && (
        <div className="ui-surface space-y-4 p-6">
          <label className="block">
            <span className="text-muted mb-1 block text-sm font-medium">
              Challenge name
            </span>
            <input
              className="ui-input w-full text-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="GymRats Q2"
            />
          </label>
          <label className="block">
            <span className="text-muted mb-1 block text-sm font-medium">
              Start
            </span>
            <input
              type="datetime-local"
              className="ui-input w-full text-foreground"
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-muted mb-1 block text-sm font-medium">
              End
            </span>
            <input
              type="datetime-local"
              className="ui-input w-full text-foreground"
              value={endStr}
              onChange={(e) => setEndStr(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-muted mb-1 block text-sm font-medium">
              Timezone
            </span>
            <select
              className="ui-input w-full text-foreground"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="America/Sao_Paulo">America/Sao_Paulo</option>
              <option value="America/Fortaleza">America/Fortaleza</option>
              <option value="Europe/Lisbon">Europe/Lisbon</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
          <button
            type="button"
            className="ui-btn-primary mt-2 w-full disabled:opacity-40"
            disabled={!canNext0}
            onClick={() => setStep(1)}
          >
            Next
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="ui-surface space-y-4 p-6">
          <p className="text-muted text-sm">
            Presets and JSON editor. Activities are validated with the same
            rules as check-ins.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ui-btn-secondary px-4 py-2 text-sm"
              onClick={() => {
                setScoringJson(SIMPLE_PRESET);
                validateRules(SIMPLE_PRESET);
              }}
            >
              Simple (1 pt)
            </button>
            <button
              type="button"
              className="ui-btn-secondary px-4 py-2 text-sm"
              onClick={applyNucelTemplate}
            >
              Load NuCel template
            </button>
          </div>
          <div>
            <span className="text-muted mb-1 block text-sm">
              Paste full import JSON (optional)
            </span>
            <textarea
              className="ui-input mb-2 min-h-[80px] w-full font-mono text-xs text-foreground"
              value={importPaste}
              onChange={(e) => setImportPaste(e.target.value)}
              placeholder='{ "activities": [...], "ranking_weights": {...} }'
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
            <span className="text-muted mb-1 block text-sm">
              Scoring rules JSON (activities array)
            </span>
            <textarea
              className="ui-input min-h-[220px] w-full font-mono text-xs text-foreground"
              value={scoringJson}
              onChange={(e) => {
                setScoringJson(e.target.value);
                validateRules(e.target.value);
              }}
            />
            {rulesError && (
              <p className="mt-2 text-sm text-red-800">{rulesError}</p>
            )}
            <p className="text-muted mt-1 text-xs">
              {activityCount} activit{activityCount === 1 ? "y" : "ies"}
            </p>
          </label>
          <div className="flex gap-3 pt-2">
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
        <div className="ui-surface space-y-4 p-6">
          <label className="block">
            <span className="text-muted mb-1 block text-sm">
              Max check-ins / day
            </span>
            <input
              type="number"
              min={1}
              max={10}
              className="ui-input w-full"
              value={maxCheckinsPerDay}
              onChange={(e) => setMaxCheckinsPerDay(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="text-muted mb-1 block text-sm">
              Min check-in duration (minutes)
            </span>
            <input
              type="number"
              min={1}
              className="ui-input w-full"
              value={minCheckinDurationMin}
              onChange={(e) =>
                setMinCheckinDurationMin(Number(e.target.value))
              }
            />
          </label>
          <label className="block">
            <span className="text-muted mb-1 block text-sm">
              2nd check-in min total daily minutes (empty = off)
            </span>
            <input
              type="number"
              min={1}
              className="ui-input w-full"
              value={secondCheckinMinTotalMin}
              onChange={(e) => setSecondCheckinMinTotalMin(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-muted mb-1 block text-sm">
                Weight points
              </span>
              <input
                className="ui-input w-full"
                value={rankingPoints}
                onChange={(e) => setRankingPoints(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-muted mb-1 block text-sm">
                Weight consistency
              </span>
              <input
                className="ui-input w-full"
                value={rankingConsistency}
                onChange={(e) => setRankingConsistency(e.target.value)}
              />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="ui-btn-secondary flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="button"
              className="ui-btn-primary flex-1"
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={onCreateSubmit}
          encType="multipart/form-data"
          className="ui-surface space-y-4 p-6"
        >
          {formState && "error" in formState && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {formState.error}
            </p>
          )}
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="startDate" value={startStr} />
          <input type="hidden" name="endDate" value={endStr} />
          <input type="hidden" name="timezone" value={timezone} />
          <input type="hidden" name="scoringRulesJson" value={scoringJson} />
          <input
            type="hidden"
            name="maxCheckinsPerDay"
            value={maxCheckinsPerDay}
          />
          <input
            type="hidden"
            name="minCheckinDurationMin"
            value={minCheckinDurationMin}
          />
          <input
            type="hidden"
            name="secondCheckinMinTotalMin"
            value={secondCheckinMinTotalMin}
          />
          <input type="hidden" name="rankingPoints" value={rankingPoints} />
          <input
            type="hidden"
            name="rankingConsistency"
            value={rankingConsistency}
          />
          <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-5 text-sm">
            <p>
              <strong>{name}</strong>
            </p>
            <p className="text-muted mt-2">
              {startStr} → {endStr} ({timezone})
            </p>
            <p className="text-muted mt-2">
              {activityCount} activities · max {maxCheckinsPerDay}/day · min{" "}
              {minCheckinDurationMin} min
            </p>
            {secondCheckinMinTotalMin && (
              <p className="text-muted">
                2nd check-in daily total ≥ {secondCheckinMinTotalMin} min
              </p>
            )}
            <p className="text-muted mt-2">
              Ranking: {rankingPoints} points + {rankingConsistency} consistency
            </p>
          </div>
          <p className="text-muted rounded-xl bg-violet-50/60 px-3 py-2 text-xs leading-relaxed">
            Cover image (if any) was chosen in the block above — it uploads when
            you create the challenge.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="ui-btn-secondary flex-1"
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={createPending}
              className="ui-btn-primary flex-1 disabled:opacity-50"
            >
              {createPending ? "Creating…" : "Create challenge"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
