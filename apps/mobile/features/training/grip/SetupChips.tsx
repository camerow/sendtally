import React from "react";
import { ScrollView } from "react-native";
import { sameSetup, type GripSetup } from "@sendtally/core/hang";
import { gripSetupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Chip } from "../../../components/Chip";

export type SetupChipsProps = {
  setups: readonly GripSetup[];
  /** Null for All, when offered. */
  picked: GripSetup | null;
  onPick: (setup: GripSetup | null) => void;
  withAll: boolean;
};

/** One chip per setup, the most used first, then All when offered. */
export function SetupChips({
  setups,
  picked,
  onPick,
  withAll,
}: SetupChipsProps): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -18 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
    >
      {setups.map((s) => (
        <Chip
          key={`${s.edgeMm}:${s.hangS}`}
          label={gripSetupLabel(s)}
          active={picked !== null && sameSetup(s, picked)}
          uppercase={false}
          onPress={() => onPick(s)}
        />
      ))}
      {withAll && (
        <Chip
          label={t("hang.allSetups")}
          active={picked === null}
          uppercase={false}
          onPress={() => onPick(null)}
        />
      )}
    </ScrollView>
  );
}
