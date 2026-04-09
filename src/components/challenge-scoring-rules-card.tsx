import { DEFAULT_OTHER_ACTIVITY_POINTS } from "@/lib/scoring/engine";
import { formatActivityRuleDetail } from "@/lib/scoring/describe-rule";
import { isAlwaysOnePointActivityRule } from "@/lib/scoring/one-point-rules";
import type { ScoringRules } from "@/lib/scoring/types";

export function ChallengeScoringRulesList({
  rules,
  className = "",
}: {
  rules: ScoringRules;
  className?: string;
}) {
  const visible = rules.filter((r) => !isAlwaysOnePointActivityRule(r));

  const footnote = (
    <p className="text-muted mt-4 border-border border-t pt-4 text-xs leading-relaxed">
      Anything else is {DEFAULT_OTHER_ACTIVITY_POINTS} point
      {DEFAULT_OTHER_ACTIVITY_POINTS === 1 ? "" : "s"} (including activities not
      listed above and unlisted names you log as Other).
    </p>
  );

  return (
    <div className={className.trim()}>
      {visible.length === 0 ? (
        <p className="text-muted text-xs leading-relaxed">
          Every activity in this challenge scores{" "}
          {DEFAULT_OTHER_ACTIVITY_POINTS} point
          {DEFAULT_OTHER_ACTIVITY_POINTS === 1 ? "" : "s"}, including anything you
          log as Other or that is not in the challenge list.
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {visible.map((rule) => (
              <li key={rule.name}>
                <p className="text-foreground text-sm font-medium">{rule.name}</p>
                <ul className="text-muted mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed">
                  {formatActivityRuleDetail(rule).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {footnote}
        </>
      )}
    </div>
  );
}

export function ChallengeScoringRulesCard({ rules }: { rules: ScoringRules }) {
  return (
    <div className="ui-surface !rounded-2xl !p-4">
      <h2 className="text-foreground text-sm font-semibold tracking-tight">
        Scoring rules
      </h2>
      <ChallengeScoringRulesList rules={rules} className="mt-3" />
    </div>
  );
}
