import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { SelectField } from "../../components/SelectField";
import { Sheet } from "../../components/Sheet";
import { SheetHeader } from "../../components/SheetHeader";
import { SheetSection } from "../../components/SheetSection";
import { useHangData } from "../data/HangDataContext";
import { GripPickerSheet } from "../grip-picker/GripPickerSheet";
import { DayToggles } from "./DayToggles";
import { EndSection } from "./EndSection";
import { LoadRows } from "./LoadRows";
import { PlannerFooter } from "./PlannerFooter";
import { StartSection } from "./StartSection";
import type { PlannerRequest } from "./types";
import { usePlanner } from "./usePlanner";
import { WorkoutChoice } from "./WorkoutChoice";

type Calendar = "start" | "end" | null;

function PlannerBody({
  request,
  onClose,
}: {
  request: PlannerRequest;
  onClose: () => void;
}): React.ReactElement {
  const { model } = useHangData();
  const [open, setOpen] = React.useState(true);
  const close = (): void => setOpen(false);
  const planner = usePlanner(request, close);
  const [calendar, setCalendar] = React.useState<Calendar>(null);
  const [picker, setPicker] = React.useState(false);
  const { workout, draft, isEdit } = planner;
  const grips = draft.grips.map(model.gripName).join(", ");
  const toggle = (which: Exclude<Calendar, null>) => (isOpen: boolean) =>
    setCalendar(isOpen ? which : null);

  return (
    <Sheet
      visible={open}
      onClose={onClose}
      closeLabel={t("hang.closeScheduler")}
      footer={<PlannerFooter planner={planner} />}
    >
      <View style={{ gap: 22 }}>
        <SheetHeader
          kicker={t("hang.schedule")}
          title={isEdit ? t("hang.editSchedule") : t("hang.planBlock")}
          action={t("hang.cancel")}
          onAction={close}
        />
        <WorkoutChoice planner={planner} />
        {workout !== undefined && (
          <>
            <SheetSection label={isEdit ? t("hang.grip") : t("hang.grips")}>
              <SelectField
                text={grips || (isEdit ? t("hang.chooseAGrip") : t("hang.chooseGrips"))}
                placeholder={grips === ""}
                label={isEdit ? t("hang.grip") : t("hang.grips")}
                onPress={() => setPicker(true)}
              />
            </SheetSection>
            <LoadRows planner={planner} />
            <DayToggles planner={planner} />
            <StartSection
              planner={planner}
              open={calendar === "start"}
              onToggle={toggle("start")}
            />
            <EndSection planner={planner} open={calendar === "end"} onToggle={toggle("end")} />
          </>
        )}
      </View>
      {workout !== undefined && (
        <GripPickerSheet
          visible={picker}
          workout={workout}
          multi={!isEdit}
          selected={draft.grips}
          onPick={planner.toggleGrip}
          onClose={() => setPicker(false)}
        />
      )}
    </Sheet>
  );
}

export type PlannerSheetProps = { request: PlannerRequest | null; onClose: () => void };

/** Plan a block, or Edit schedule for one scheduled workout. A fresh draft per open; `onClose` runs once the sheet has slid away. */
export function PlannerSheet({ request, onClose }: PlannerSheetProps): React.ReactElement | null {
  return request === null ? null : <PlannerBody request={request} onClose={onClose} />;
}
