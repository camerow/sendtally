import React from "react";
import { Text } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../../components/Segmented";
import { SheetSection } from "../../components/SheetSection";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";

export function UnitsSetting(): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  return (
    <SheetSection label={t("hang.weightUnits")}>
      <Segmented<WeightUnit>
        surface="light"
        height={44}
        value={model.settings.units}
        onChange={(units) => void actions.saveSettings({ units })}
        options={[
          { value: "kg", label: t("hang.kilograms") },
          { value: "lb", label: t("hang.pounds") },
        ]}
      />
      <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: c.ink2 }]}>
        {t("hang.unitsNote")}
      </Text>
    </SheetSection>
  );
}
