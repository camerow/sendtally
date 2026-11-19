import React from "react";
import type { HangKind, HangSetup, ItemDone, SetDone, WeightUnit } from "@sendtally/core/hang";
import { HangDataProvider } from "../data/HangDataProvider";
import { SetupPill } from "../done/SetupPill";
import { DoneDetails } from "./DoneDetails";

export type PartSetsProps = {
  /** Each grip's sets, by grip id; a set at no hangs did not hold. */
  done: readonly ItemDone[];
  /** Each grip's dose, which a set short of it reads against. */
  planned: readonly (SetDone | undefined)[];
  /** The first grip's edge and load, on its pill; its sets with no load of their own follow it. */
  setup: HangSetup;
  kind: HangKind;
  unit: WeightUnit;
  gripName: (id: string) => string;
  onSetup: (setup: HangSetup) => void;
  onChange: (done: ItemDone[]) => void;
  onRemoved?: (message: string, undo: () => void) => void;
};

/**
 * Grip sets to edit in place, with no tick: hangs, load and RPE per set, the first grip's edge
 * and load on its pill. One way for every place a fingerboard part or hang session is edited.
 */
export function PartSets({
  done,
  planned,
  setup,
  kind,
  unit,
  gripName,
  onSetup,
  onChange,
  onRemoved,
}: PartSetsProps): React.ReactElement {
  const first = done[0]?.exercise ?? "";
  return (
    <HangDataProvider>
      <DoneDetails
        done={done.map((d) => ({ ...d, exercise: gripName(d.exercise) }))}
        off={[]}
        planned={planned}
        unit={unit}
        hangs
        flat
        hangLoadKg={setup.loadKg}
        setup={<SetupPill kind={kind} setup={setup} kicker={gripName(first)} onChange={onSetup} />}
        {...(onRemoved !== undefined && { onRemoved })}
        onChange={(next) =>
          onChange(
            next.map((d) => ({
              ...d,
              exercise: done.find((x) => x.item === d.item)?.exercise ?? d.exercise,
            }))
          )
        }
      />
    </HangDataProvider>
  );
}
