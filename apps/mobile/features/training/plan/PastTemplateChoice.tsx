import React from "react";
import { View } from "react-native";
import type { ActivityDetail, ActivityKind } from "@sendtally/api-client";
import { detailFromTemplate, templateOf, useActivities } from "@sendtally/features/activities";
import { dayMonth } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Chip } from "../../../components/Chip";
import { useApi } from "../../../lib/api";
import { SheetSection } from "../components/SheetSection";

const SHOWN = 5;

export type PastTemplateChoiceProps = {
  kind: ActivityKind;
  onPick: (template: ActivityDetail | null) => void;
};

/** The newest few logged sessions of the kind with sets or a checklist, to plan from. Hidden without any. */
export function PastTemplateChoice({
  kind,
  onPick,
}: PastTemplateChoiceProps): React.ReactElement | null {
  const { state } = useActivities(useApi());
  const past =
    state.status === "ready" ? state.data.filter((a) => a.kind === kind && a.detail !== null) : [];
  const distinct = past.filter((a, i) => past.findIndex((b) => b.title === a.title) === i);
  if (distinct.length === 0) return null;
  return (
    <SheetSection label={t("plan.fromPast")}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {distinct.slice(0, SHOWN).map((a) => (
          <Chip
            key={a.id}
            label={`${a.title} · ${dayMonth(a.date)}`}
            uppercase={false}
            active={false}
            onPress={() => onPick(detailFromTemplate(templateOf(a.detail)))}
          />
        ))}
      </View>
    </SheetSection>
  );
}
