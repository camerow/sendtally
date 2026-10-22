import React from "react";
import { Text, View } from "react-native";
import type { ActivityDetail, ActivityKind, PlanTemplate } from "@sendtally/api-client";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { emptyDetail } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";
import { ChecklistEditor } from "./ChecklistEditor";
import { SetsEditor } from "./SetsEditor";

export type DetailSectionProps = {
  value: ActivityDetail | null;
  kind: ActivityKind;
  unit: WeightUnit;
  /** A plan's template, whose sets show as targets while logging. */
  targets: PlanTemplate | null;
  /** Editing what a plan prescribes: no ticks, and nothing counts as done. */
  template: boolean;
  inSheet: boolean;
  onChange: (value: ActivityDetail | null) => void;
};

/** The optional body: sets, a checklist, or neither. */
export function DetailSection({
  value,
  kind,
  unit,
  targets,
  template,
  inSheet,
  onChange,
}: DetailSectionProps): React.ReactElement {
  const remove =
    value === null ? undefined : (
      <Button
        label={t("activities.removeDetails")}
        variant="danger"
        height={36}
        onPress={() => onChange(null)}
      />
    );
  return (
    <SheetSection label={t("activities.details")} aside={remove}>
      {value === null ? (
        <View style={{ gap: 10 }}>
          <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
            {template ? t("activities.templateHint") : t("activities.detailsHint")}
          </Text>
          <Button
            label={t("activities.addSets")}
            icon="plus"
            variant="outline"
            onPress={() => onChange(emptyDetail("sets", kind))}
          />
          <Button
            label={t("activities.addChecklist")}
            icon="plus"
            variant="outline"
            onPress={() => onChange(emptyDetail("checklist", kind))}
          />
        </View>
      ) : value.kind === "sets" ? (
        <SetsEditor
          value={value}
          kind={kind}
          targets={targets}
          unit={unit}
          template={template}
          inSheet={inSheet}
          onChange={onChange}
        />
      ) : (
        <ChecklistEditor value={value} template={template} inSheet={inSheet} onChange={onChange} />
      )}
    </SheetSection>
  );
}
