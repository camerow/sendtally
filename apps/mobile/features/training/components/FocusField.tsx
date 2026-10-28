import React from "react";
import { Text } from "react-native";
import { FOCI, type Focus } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { focusLabel, focusMeaning, focusParam, readFocus } from "@sendtally/features/training";
import { type } from "../type";
import { ChipRow } from "./ChipRow";
import { SheetSection } from "./SheetSection";

export type FocusFieldProps = {
  value: Focus | null;
  onChange: (focus: Focus | null) => void;
  /** Said under the chips in place of what the picked focus means. */
  note?: string;
};

/** Pick what something trains for: General first, then the seven in season order. */
export function FocusField({ value, onChange, note }: FocusFieldProps): React.ReactElement {
  const options = [null, ...FOCI].map((f) => ({ value: focusParam(f), label: focusLabel(f) }));
  return (
    <SheetSection label={t("focus.label")}>
      <ChipRow
        options={options}
        value={focusParam(value)}
        onChange={(picked) => onChange(readFocus(picked) ?? null)}
      />
      <Text style={[type.body, { fontSize: 13, lineHeight: 18, color: colors.textSecondary }]}>
        {note ?? focusMeaning(value)}
      </Text>
    </SheetSection>
  );
}
