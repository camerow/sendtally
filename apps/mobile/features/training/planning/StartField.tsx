import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { DateField } from "../components/DateField";
import { MonthCalendar } from "../components/MonthCalendar";
import { SheetSection } from "../components/SheetSection";
import { useHangData } from "../data/HangDataContext";

export type StartFieldProps = {
  value: CalendarDate;
  min: CalendarDate | null;
  onChange: (date: CalendarDate) => void;
};

/** The day something starts, picked on a month that opens under it. */
export function StartField({ value, min, onChange }: StartFieldProps): React.ReactElement {
  const { today } = useHangData();
  const [open, setOpen] = React.useState(false);
  return (
    <SheetSection label={t("plan.starts")}>
      <DateField
        text={shortDate(value)}
        open={open}
        onToggle={() => setOpen(!open)}
        label={t("plan.starts")}
      />
      {open && (
        <MonthCalendar
          selected={value}
          min={min}
          today={today}
          shaded={() => false}
          onPick={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      )}
    </SheetSection>
  );
}
