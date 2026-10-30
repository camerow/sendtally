import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { DateField } from "../components/DateField";
import { MonthCalendar } from "../components/MonthCalendar";
import { SheetSection } from "../components/SheetSection";
import { useHangData } from "../data/HangDataContext";

export type StartFieldProps = {
  /** None reads as not scheduled. */
  value: CalendarDate | null;
  min: CalendarDate | null;
  onChange: (date: CalendarDate) => void;
  /** Offers no start at all, which keeps a block as a template. */
  onNone?: () => void;
};

/** The day something starts, picked on a month that opens under it, or none for a template. */
export function StartField({ value, min, onChange, onNone }: StartFieldProps): React.ReactElement {
  const { today } = useHangData();
  const [open, setOpen] = React.useState(false);
  return (
    <SheetSection label={t("plan.starts")}>
      <DateField
        text={value === null ? t("plan.notScheduled") : shortDate(value)}
        open={open}
        onToggle={() => setOpen(!open)}
        label={t("plan.starts")}
      />
      {open && (
        <MonthCalendar
          selected={value ?? today}
          min={min}
          today={today}
          shaded={() => false}
          onPick={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      )}
      {open && onNone !== undefined && value !== null && (
        <Button
          label={t("plan.noStart")}
          onPress={() => {
            onNone();
            setOpen(false);
          }}
          variant="link"
          height={44}
        />
      )}
    </SheetSection>
  );
}
