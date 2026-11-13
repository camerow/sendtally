import React from "react";
import { useNavigate } from "react-router";
import { monthStart } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useHangData } from "../data/HangDataContext";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarMonth } from "./CalendarMonth";
import { planDayPath } from "./paths";

/** The plan a month at a time; a day opens its page. */
export function CalendarPage(): React.ReactElement {
  const navigate = useNavigate();
  const { today } = useHangData();
  const [month, setMonth] = React.useState(() => monthStart(today));
  return (
    <DetailFrame
      backTo="/app/plan"
      action={
        <button
          type="button"
          className="outline-action"
          onClick={() => setMonth(monthStart(today))}
        >
          {t("training.today")}
        </button>
      }
      footer={<CalendarLegend />}
    >
      <CalendarMonth
        month={month}
        onMonth={setMonth}
        onPick={(date) => void navigate(planDayPath(date))}
      />
    </DetailFrame>
  );
}
