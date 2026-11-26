import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { useMemberWeek } from "@sendtally/features/settings";
import { useLibrary } from "../../training/library/useLibrary";
import { WeekCard } from "./components/WeekCard";

export function MemberWeek({ api }: { api: SendtallyApi }): React.ReactElement {
  const { week, sessions } = useMemberWeek(api, useLibrary().state);
  return (
    <WeekCard
      week={week}
      meta={t("onboarding.plan.week.perWeek", { count: sessions })}
      empty={t("onboarding.plan.week.empty")}
    />
  );
}
