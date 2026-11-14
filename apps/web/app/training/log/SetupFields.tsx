import React from "react";
import {
  MAX_EDGE_MM,
  MIN_EDGE_MM,
  fromUnit,
  toUnit,
  type HangKind,
  type HangSetup,
} from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { NumberField } from "../../components/NumberField";
import { useHangData } from "../data/HangDataContext";

export type SetupFieldsProps = {
  kind: HangKind;
  setup: HangSetup;
  onChange: (setup: HangSetup) => void;
};

/** The edge a hang runs on and the weight it adds, or a lift's weight. */
export function SetupFields({ kind, setup, onChange }: SetupFieldsProps): React.ReactElement {
  const unit = useHangData().model.settings.units;
  return (
    <div className="setup-fields">
      {kind === "hang" && (
        <NumberField
          label={t("hang.edgeDepth")}
          value={setup.edgeMm}
          unit="mm"
          mode={{ kind: "number", step: 1, min: MIN_EDGE_MM, max: MAX_EDGE_MM }}
          onChange={(edgeMm) => onChange({ ...setup, edgeMm })}
        />
      )}
      <NumberField
        label={kind === "hang" ? t("hang.addedWeight") : t("hang.weight")}
        value={toUnit(setup.loadKg, unit)}
        unit={unit}
        mode={{
          kind: "number",
          step: unit === "lb" ? 5 : 2.5,
          min: toUnit(-200, unit),
          max: toUnit(1000, unit),
          decimals: true,
          signed: true,
        }}
        onChange={(n) => onChange({ ...setup, loadKg: fromUnit(n, unit) })}
      />
      {kind === "hang" && <p className="form-hint">{t("hang.assistNote")}</p>}
    </div>
  );
}
