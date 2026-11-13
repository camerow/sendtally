import React from "react";
import { Text, View } from "react-native";
import type { HangSetup } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { TodayEntry } from "@sendtally/features/workouts";
import { Label } from "../components/Label";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { SetupFields } from "../setup/SetupFields";
import { type } from "../type";

export type ForTodaySheetProps = {
  kicker: string;
  entries: readonly TodayEntry[];
  setups: readonly HangSetup[];
  onChange: (setups: HangSetup[]) => void;
  onClose: () => void;
};

/** This run's edge and weight, changed for today only; the plan stays as written. */
export function ForTodaySheet({
  kicker,
  entries,
  setups,
  onChange,
  onClose,
}: ForTodaySheetProps): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const planned = entries.map((e) => setupLabel(e.kind, e.planned, unit)).join(", ");
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.done")}>
      <View style={{ gap: 18, paddingBottom: 12 }}>
        <SheetHeader
          kicker={kicker}
          kickerColor={colors.petalInk}
          title={t("hang.forToday")}
          action={t("common.done")}
          onAction={onClose}
        />
        {entries.map((e, i) => (
          <View key={i} style={{ gap: 12 }}>
            {entries.length > 1 && (
              <Label color={colors.gunmetal}>{model.gripName(e.gripId)}</Label>
            )}
            <SetupFields
              kind={e.kind}
              setup={setups[i] ?? e.planned}
              onChange={(setup) => onChange(setups.map((old, j) => (j === i ? setup : old)))}
            />
          </View>
        ))}
        <Text style={[type.mono, { fontSize: 12, lineHeight: 17, color: colors.textSecondary }]}>
          {t("hang.forTodayNote", { planned })}
        </Text>
      </View>
    </HangSheet>
  );
}
