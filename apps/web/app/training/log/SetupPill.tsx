import React from "react";
import type { HangKind, HangSetup } from "@sendtally/core/hang";
import { setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { useHangData } from "../data/HangDataContext";
import { SetupFields } from "./SetupFields";

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
        <SetupFields kind={kind} setup={setup} onChange={onChange} />
      </Sheet>
    </>
  );
}
