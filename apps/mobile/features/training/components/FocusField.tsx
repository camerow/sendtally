import React from "react";
import { Text } from "react-native";
import { FOCI, type Focus } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { focusLabel, focusMeaning } from "@sendtally/features/training";
import { OptionRow } from "../../../components/OptionRow";
import { SelectRow } from "../../../components/SelectRow";
import { type } from "../type";
import { SheetSection } from "./SheetSection";

export type FocusFieldProps = {
  value: Focus | null;
  onChange: (focus: Focus | null) => void;
};

/** Pick what something trains for: General first, then the seven in season order. */
export function FocusField({ value, onChange }: FocusFieldProps): React.ReactElement {
  return (
    <SheetSection label={t("focus.label")}>
      <SelectRow label={t("focus.label")} value={focusLabel(value)}>
        {(close) =>
          [null, ...FOCI].map((f) => (
            <OptionRow
              key={f ?? "general"}
              label={focusLabel(f)}
              selected={f === value}
              mono={false}
              onPress={() => {
                onChange(f);
                close();
              }}
            />
          ))
        }
      </SelectRow>
      <Text style={[type.body, { fontSize: 13, lineHeight: 18, color: colors.textSecondary }]}>
        {focusMeaning(value)}
      </Text>
    </SheetSection>
  );
}
