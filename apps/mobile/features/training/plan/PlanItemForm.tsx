import React from "react";
import { View } from "react-native";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { SheetHeader } from "../components/SheetHeader";
import { HangSheet } from "../data/HangSheet";
import { EndSection } from "../planner/EndSection";
import { PlannerFooter } from "../planner/PlannerFooter";
import { StartSection } from "../planner/StartSection";
import { MinutesField } from "./MinutesField";
import { ProjectChoice } from "./ProjectChoice";
import { ScheduleChoice } from "./ScheduleChoice";
import { TargetEffort } from "./TargetEffort";
import { TitleField } from "./TitleField";
import type { PlanItemRequest } from "./types";
import { usePlanItemForm } from "./usePlanItemForm";

type Calendar = "start" | "end" | null;

export type PlanItemFormProps = { request: PlanItemRequest; onClose: () => void };

/** Plan training, or Edit plan, for anything that is not a hangboard workout. */
export function PlanItemForm({ request, onClose }: PlanItemFormProps): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  const close = (): void => setOpen(false);
  const form = usePlanItemForm(request, close);
  const [calendar, setCalendar] = React.useState<Calendar>(null);
  const toggle = (which: Exclude<Calendar, null>) => (isOpen: boolean) =>
    setCalendar(isOpen ? which : null);
  const { draft, update } = form;

  return (
    <HangSheet
      visible={open}
      onClose={onClose}
      closeLabel={t("plan.close")}
      footer={<PlannerFooter planner={form} addLabel={t("training.addToPlan")} />}
    >
      <View style={{ gap: 20, paddingBottom: 12 }}>
        <SheetHeader
          kicker={kindLabel(draft.kind)}
          title={form.isEdit ? t("plan.editPlan") : t("plan.planTraining")}
          action={t("hang.cancel")}
          onAction={close}
        />
        <TitleField value={draft.title} onChange={(title) => update({ title })} />
        {draft.kind === "climb" && (
          <ProjectChoice value={draft.projectId} onChange={(projectId) => update({ projectId })} />
        )}
        <TargetEffort value={draft.targetRpe} onChange={(targetRpe) => update({ targetRpe })} />
        <ScheduleChoice form={form} />
        <StartSection planner={form} open={calendar === "start"} onToggle={toggle("start")} />
        <EndSection planner={form} open={calendar === "end"} onToggle={toggle("end")} />
        <MinutesField value={draft.minutes} onChange={(minutes) => update({ minutes })} />
      </View>
    </HangSheet>
  );
}
