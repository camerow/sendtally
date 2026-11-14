import React from "react";
import { todayIn, type CalendarDate } from "@sendtally/core/hang";

const MINUTE = 60_000;

/** Today's calendar date, rolling over at midnight and when the tab is shown again. */
export function useToday(): CalendarDate {
  const [today, setToday] = React.useState(() => todayIn());
  React.useEffect(() => {
    const refresh = (): void => setToday(todayIn());
    const shown = (): void => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = setInterval(refresh, MINUTE);
    document.addEventListener("visibilitychange", shown);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", shown);
    };
  }, []);
  return today;
}
