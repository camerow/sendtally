import React from "react";
import { View } from "react-native";
import type { ClimbFocus } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { CLIMB_FOCUSES, focusLabel } from "@sendtally/features/workouts";
import { Chip } from "../../../components/Chip";
import { SheetSection } from "../components/SheetSection";

export type FocusChoiceProps = { value: ClimbFocus; onChange: (focus: ClimbFocus) => void };

/** What a climbing session is for. */
export function FocusChoice({ value, onChange }: FocusChoiceProps): React.ReactElement {
  return (
    <SheetSection label={t("workouts.focus")}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {CLIMB_FOCUSES.map((f) => (
          <Chip key={f} label={focusLabel(f)} active={f === value} onPress={() => onChange(f)} />
        ))}
      </View>
    </SheetSection>
  );
}
