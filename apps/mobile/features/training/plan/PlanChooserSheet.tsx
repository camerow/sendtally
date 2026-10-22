import React from "react";
import { View } from "react-native";
import { PLAN_KINDS, kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { PlanChoiceRow } from "./PlanChoiceRow";
import type { PlanChoice } from "./types";

export type PlanChooserSheetProps = { onClose: (choice: PlanChoice | null) => void };

/** Plan training: what to plan, before the sheet for it. Closes with the pick, once slid away. */
export function PlanChooserSheet({ onClose }: PlanChooserSheetProps): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  const picked = React.useRef<PlanChoice | null>(null);
  const pick = (choice: PlanChoice): void => {
    picked.current = choice;
    setOpen(false);
  };
  const choices: { kind: PlanChoice; title: string }[] = [
    { kind: "hang", title: t("plan.hangboardWorkout") },
    ...PLAN_KINDS.map((kind) => ({ kind, title: kindLabel(kind) })),
  ];
  return (
    <Sheet visible={open} onClose={() => onClose(picked.current)} closeLabel={t("plan.close")}>
      <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 4 }}>
        <SheetHeader
          kicker={t("plan.kicker")}
          title={t("plan.planTraining")}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
        <SheetSection label={t("plan.whatToPlan")} gap={2}>
          {choices.map((c) => (
            <PlanChoiceRow
              key={c.kind}
              kind={c.kind}
              title={c.title}
              onPress={() => pick(c.kind)}
            />
          ))}
        </SheetSection>
      </View>
    </Sheet>
  );
}
