import React from "react";
import { AppState } from "react-native";
import { todayIn, type CalendarDate } from "@sendtally/core/hang";

const MINUTE = 60_000;

/** Today's calendar date, rolling over at midnight and when the app returns to the foreground. */
export function useToday(): CalendarDate {
  const [today, setToday] = React.useState(() => todayIn());
  React.useEffect(() => {
    const refresh = (): void => setToday(todayIn());
    const timer = setInterval(refresh, MINUTE);
    const subscription = AppState.addEventListener("change", (s) => s === "active" && refresh());
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return today;
}
