import React from "react";
import { View } from "react-native";
import type { TrainingBlock } from "@sendtally/api-client";
import { parseNumber } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { HangSheet } from "../data/HangSheet";
import { DetailTextInput } from "../detail/DetailTextInput";
import { TitleField } from "../plan/TitleField";
import { PlannerFooter } from "../planner/PlannerFooter";
import { StartSection } from "../planner/StartSection";
import { LoadWeeks } from "./LoadWeeks";
import { useBlockForm } from "./useBlockForm";

export type BlockFormProps = {
  block: TrainingBlock | null;
  onClose: (created: TrainingBlock | null) => void;
};

/** New block, or Edit block: name, dates, a load per week and notes. */
export function BlockForm({ block, onClose }: BlockFormProps): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  const [calendar, setCalendar] = React.useState(false);
  const created = React.useRef<TrainingBlock | null>(null);
  const form = useBlockForm(block, (made) => {
    created.current = made;
    setOpen(false);
  });
  const { draft, update } = form;

  return (
    <HangSheet
      visible={open}
      onClose={() => onClose(created.current)}
      closeLabel={t("plan.closeBlock")}
      footer={<PlannerFooter planner={form} addLabel={t("plan.createBlock")} />}
    >
      <View style={{ gap: 20, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("plan.blockKicker")}
          title={form.isEdit ? t("plan.editBlock") : t("plan.newBlock")}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
        <TitleField value={draft.name} onChange={(name) => update({ name })} />
        <StartSection planner={form} open={calendar} onToggle={setCalendar} />
        <SheetSection label={t("plan.weeks")}>
          <Stepper
            value={String(draft.weeks)}
            onCommit={(text) => {
              const n = parseNumber(text);
              if (n !== null) form.setWeeks(n);
            }}
            onStep={(dir) => form.setWeeks(draft.weeks + dir)}
            label={t("plan.weeks")}
            decreaseLabel={t("plan.fewerWeeks")}
            increaseLabel={t("plan.moreWeeks")}
            surface="plain"
            inputWidth={64}
            keyboard="number-pad"
            inSheet
          />
        </SheetSection>
        <LoadWeeks loads={draft.loads} onChange={(loads) => update({ loads })} />
        <SheetSection label={t("plan.notes")}>
          <DetailTextInput
            value={draft.notes}
            onChange={(notes) => update({ notes })}
            label={t("plan.notes")}
            placeholder={t("plan.notesPlaceholder")}
            maxLength={2000}
            inSheet
          />
        </SheetSection>
        {form.canEnd && (
          <Button label={t("plan.endBlock")} onPress={form.end} variant="outline" height={50} />
        )}
      </View>
    </HangSheet>
  );
}
