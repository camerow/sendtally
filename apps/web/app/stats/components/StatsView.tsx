import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { defaultRange, shownRange, yearsOf, type TrendRange } from "@sendtally/features/trends";
import { AccountButton } from "../../components/AccountButton";
import { Segmented } from "../../components/Segmented";
import { useAppApi } from "../../lib/useAppApi";
import { HangDataProvider } from "../../training/data/HangDataProvider";
import { ClimbingInsights } from "./ClimbingInsights";
import { RangeChips } from "./RangeChips";
import { TrainingInsights } from "./training/TrainingInsights";

type StatsSegment = "climbing" | "training";

/** Climbing and Training over one range; the segment is in the address so Back and a reload keep it. */
export function StatsView({ member }: { member: boolean }): React.ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const segment: StatsSegment = params.get("segment") === "training" ? "training" : "climbing";
  const [picked, setPicked] = React.useState<TrendRange | null>(null);
  const range = shownRange(member, picked ?? defaultRange(member));
  const { state } = useQuery(queries.sessionsWithClimbs(useAppApi()));
  const years = React.useMemo(
    () =>
      state.status !== "ready"
        ? []
        : yearsOf([
            ...state.data.sessions.map((s) => s.start_at),
            ...state.data.hangSessions.map((h) => h.date),
            ...state.data.activities.map((a) => a.date),
          ]),
    [state]
  );
  return (
    <div className="stats">
      <div className="sessions-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">{t("statistics.tab")}</h1>
        <div style={{ flex: 1 }} />
        <AccountButton />
      </div>
      <Segmented<StatsSegment>
        label={t("statistics.tab")}
        value={segment}
        onChange={(next) =>
          setParams(next === "climbing" ? {} : { segment: next }, { replace: true })
        }
        options={[
          { value: "climbing", label: t("statistics.climbing") },
          { value: "training", label: t("statistics.training") },
        ]}
      />
      <RangeChips
        member={member}
        shown={range}
        onPick={setPicked}
        years={years}
        onLocked={() => void navigate("/app/membership")}
      />
      {segment === "climbing" ? (
        <ClimbingInsights range={range} />
      ) : (
        <HangDataProvider>
          <TrainingInsights range={range} />
        </HangDataProvider>
      )}
    </div>
  );
}
