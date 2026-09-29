import React from "react";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { DateField } from "../../components/DateField";
import { MonthCalendar } from "../../components/MonthCalendar";
import { SheetSection } from "../../components/SheetSection";
import { useHangData } from "../data/HangDataContext";
import { pickStart, type Planner } from "./usePlanner";

export type StartSectionProps = {
  planner: Planner;
  open: boolean;
  onToggle: (open: boolean) => void;
};

export function StartSection({ planner, open, onToggle }: StartSectionProps): React.ReactElement {
  const { today } = useHangData();
  const { start, minStart } = planner.draft;
  const text = start === today ? t("hang.todayDate", { date: shortDate(start) }) : shortDate(start);
  return (
    <SheetSection label={t("hang.starts")}>
      <DateField
        text={text}
        open={open}
        onToggle={() => onToggle(!open)}
        label={t("hang.starts")}
      />
      {open && (
        <MonthCalendar
          selected={start}
          min={minStart}
          today={today}
          shaded={planner.shaded}
          onPick={(d) => {
            planner.update(pickStart(planner.draft, d));
            onToggle(false);
          }}
        />
      )}
    </SheetSection>
  );
}
