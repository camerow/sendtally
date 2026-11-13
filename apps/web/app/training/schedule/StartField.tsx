import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { MonthCalendar } from "../components/MonthCalendar";
import { useHangData } from "../data/HangDataContext";

/** The day something starts, picked on a month that opens under it. */
export function StartField({
  value,
  min,
  onChange,
}: {
  value: CalendarDate;
  min: CalendarDate | null;
  onChange: (date: CalendarDate) => void;
}): React.ReactElement {
  const { today } = useHangData();
  const [open, setOpen] = React.useState(false);
  return (
    <section className="schedule-section">
      <h2 className="plan-label plan-label--muted">{t("plan.starts")}</h2>
      <button
        type="button"
        className="date-field"
        aria-expanded={open}
        aria-label={`${t("plan.starts")}, ${shortDate(value)}`}
        onClick={() => setOpen(!open)}
      >
        {shortDate(value)}
        <Icon name="today" size={18} />
      </button>
      {open && (
        <MonthCalendar
          selected={value}
          min={min}
          today={today}
          onPick={(d) => {
            onChange(d);
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}
