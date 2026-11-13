import React from "react";
import { useNavigate } from "react-router";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { defaultRange, shownRange, statsYears, type TrendRange } from "@sendtally/features/trends";
import { AccountButton } from "../../components/AccountButton";
import { useAppApi } from "../../lib/useAppApi";
import { ClimbingInsights } from "./ClimbingInsights";
import { RangeChips } from "./RangeChips";

/** Climbing over one range; Training joins it with #289. */
export function StatsView({ member }: { member: boolean }): React.ReactElement {
  const navigate = useNavigate();
  const [picked, setPicked] = React.useState<TrendRange | null>(null);
  const range = shownRange(member, picked ?? defaultRange(member));
  const { state } = useQuery(queries.sessionsWithClimbs(useAppApi()));
  const years = React.useMemo(
    () => (state.status === "ready" ? statsYears(state.data) : []),
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
      <RangeChips
        member={member}
        shown={range}
        onPick={setPicked}
        years={years}
        onLocked={() => void navigate("/app/membership")}
      />
      <ClimbingInsights range={range} />
    </div>
  );
}
