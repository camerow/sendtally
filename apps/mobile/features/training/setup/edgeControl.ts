import { clampEdge, parseNumber } from "@sendtally/core/hang";
import { formatNumber } from "@sendtally/features/i18n";

export type EdgeControl = {
  text: string;
  commit: (text: string) => void;
  step: (direction: 1 | -1) => void;
};

/** Wires a − / input / + to an edge depth in whole millimetres. */
export function edgeControl(mm: number, set: (mm: number) => void): EdgeControl {
  return {
    text: formatNumber(mm, { useGrouping: false }),
    commit: (text) => {
      const n = parseNumber(text);
      if (n !== null) set(clampEdge(n));
    },
    step: (direction) => set(clampEdge(mm + direction)),
  };
}
