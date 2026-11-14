import React from "react";
import type { WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../../components/Segmented";
import { sectionLabel } from "../../components/styles";
import { HangDataProvider } from "../../training/data/HangDataProvider";
import { useHangData } from "../../training/data/HangDataContext";
import { Section } from "./Section";
import { bodyText } from "./styles";

const UNITS: readonly WeightUnit[] = ["lb", "kg"];

function UnitPicker(): React.ReactElement {
  const { model, actions } = useHangData();
  return (
    <Segmented
      label={t("settings.weightUnit")}
      options={UNITS.map((unit) => ({ value: unit, label: unit }))}
      value={model.settings.units}
      onChange={(units) => void actions.saveSettings({ units })}
    />
  );
}

/** The one place the weight unit is chosen; every load and lift shows in it. */
export function WeightUnitSection(): React.ReactElement {
  return (
    <Section>
      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={sectionLabel}>{t("settings.weightUnit")}</span>
        <p style={bodyText}>{t("settings.weightUnitBody")}</p>
      </span>
      <HangDataProvider fallback={<div style={{ height: 48 }} />}>
        <UnitPicker />
      </HangDataProvider>
    </Section>
  );
}
