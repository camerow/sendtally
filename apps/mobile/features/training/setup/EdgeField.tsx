import React from "react";
import { clampEdge, MAX_EDGE_MM, MIN_EDGE_MM } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Stepper } from "../components/Stepper";
import type { FieldSlot } from "../../../components/useFieldOrder";

export type EdgeFieldProps = FieldSlot & { edgeMm: number; onChange: (mm: number) => void };

export function EdgeField({ edgeMm, onChange, ...slot }: EdgeFieldProps): React.ReactElement {
  return (
    <Stepper
      {...slot}
      value={edgeMm}
      onChange={(mm) => onChange(clampEdge(mm))}
      onStep={(direction) => onChange(clampEdge(edgeMm + direction))}
      step={1}
      min={MIN_EDGE_MM}
      max={MAX_EDGE_MM}
      unit="mm"
      label={t("hang.edgeDepth")}
      decreaseLabel={t("hang.shallowerEdge")}
      increaseLabel={t("hang.deeperEdge")}
      surface="plain"
    />
  );
}
