import React from "react";
import { ScrollView } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t, type MessageKey } from "@sendtally/features/i18n";
import type { LibrarySort } from "@sendtally/features/workouts";
import { Chip } from "../../../components/Chip";
import { Label } from "../components/Label";

const SORTS: readonly { value: LibrarySort; label: MessageKey }[] = [
  { value: "recent", label: "workouts.sortRecent" },
  { value: "most", label: "workouts.sortMost" },
  { value: "name", label: "workouts.sortName" },
  { value: "duration", label: "workouts.sortDuration" },
];

export type SortChipsProps = { value: LibrarySort; onChange: (value: LibrarySort) => void };

export function SortChips({ value, onChange }: SortChipsProps): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8, alignItems: "center" }}
    >
      <Label small color={colors.textSecondary}>
        {t("workouts.sort")}
      </Label>
      {SORTS.map((s) => (
        <Chip
          key={s.value}
          label={t(s.label)}
          active={value === s.value}
          dashed
          onPress={() => onChange(s.value)}
        />
      ))}
    </ScrollView>
  );
}
