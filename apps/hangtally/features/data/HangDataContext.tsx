import React from "react";
import type { CalendarDate } from "@sendtally/core/hang";
import type { HangActions, HangModel } from "@sendtally/features/hang";

export type HangData = { model: HangModel; actions: HangActions; today: CalendarDate };

export const HangDataContext = React.createContext<HangData | null>(null);

export function useHangData(): HangData {
  const data = React.useContext(HangDataContext);
  if (data === null) throw new Error("useHangData outside HangDataProvider");
  return data;
}
