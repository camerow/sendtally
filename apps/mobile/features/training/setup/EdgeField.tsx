import React from "react";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { edgeControl } from "./edgeControl";

export type EdgeFieldProps = { edgeMm: number; onChange: (mm: number) => void; inSheet?: boolean };

export function EdgeField({ edgeMm, onChange, inSheet }: EdgeFieldProps): React.ReactElement {
  const edge = edgeControl(edgeMm, onChange);
  return (
    <SheetSection label={t("hang.edgeDepth")}>
      <Stepper
        value={edge.text}
        onCommit={edge.commit}
        onStep={edge.step}
        label={t("hang.edgeDepth")}
        decreaseLabel={t("hang.shallowerEdge")}
        increaseLabel={t("hang.deeperEdge")}
        surface="plain"
        keyboard="number-pad"
        inSheet={inSheet}
      />
    </SheetSection>
  );
}
