import React from "react";
import { View } from "react-native";
import { WORKOUT_KINDS, type WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { SheetHeader } from "../components/SheetHeader";
import { PlanChoiceRow } from "../plan/PlanChoiceRow";

export type KindSheetProps = {
  visible: boolean;
  kicker: string;
  /** How many workouts the library holds of each kind. */
  count: (kind: WorkoutKind) => number;
  onPick: (kind: WorkoutKind) => void;
  onClose: () => void;
};

const hint = (kind: WorkoutKind): string | undefined =>
  kind === "mobility"
    ? t("plan.kindMobilityHint")
    : kind === "other"
      ? t("plan.kindOtherHint")
      : undefined;

/** The one sheet in planning: what kind of training to add. */
export function KindSheet({
  visible,
  kicker,
  count,
  onPick,
  onClose,
}: KindSheetProps): React.ReactElement {
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("plan.close")}>
      <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 4 }}>
        <SheetHeader
          kicker={kicker}
          title={t("plan.whatKind")}
          action={t("hang.cancel")}
          onAction={onClose}
        />
        <View style={{ gap: 2 }}>
          {WORKOUT_KINDS.map((k) => (
            <PlanChoiceRow
              key={k}
              kind={k}
              title={kindLabel(k)}
              hint={hint(k)}
              count={count(k)}
              onPress={() => onPick(k)}
            />
          ))}
        </View>
      </View>
    </Sheet>
  );
}
