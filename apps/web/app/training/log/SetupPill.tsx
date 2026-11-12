import React from "react";
import {
  MAX_EDGE_MM,
  MIN_EDGE_MM,
  fromUnit,
  toUnit,
  type HangKind,
  type HangSetup,
} from "@sendtally/core/hang";
import { setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { NumberField } from "../../components/NumberField";
import { Sheet } from "../../components/Sheet";
import { useHangData } from "../data/HangDataContext";

export type SetupPillProps = {
  kind: HangKind;
  setup: HangSetup;
  /** Over the sheet, such as the grip. */
  kicker: string;
  onChange: (setup: HangSetup) => void;
};

/** The edge and weight a hang ran on, as one pill on its card; press it to change them for this log. */
export function SetupPill({ kind, setup, kicker, onChange }: SetupPillProps): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        className="setup-pill"
        aria-label={t("hang.changeSetup")}
        onClick={() => setOpen(true)}
      >
        {setupLabel(kind, setup, unit)}
      </button>
      <Sheet
        open={open}
        title={t("hang.edgeAndWeight")}
        onClose={() => setOpen(false)}
        action={{ label: t("common.done"), onPress: () => setOpen(false) }}
      >
        <span className="train-label">{kicker}</span>
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
      </Sheet>
    </>
  );
}
