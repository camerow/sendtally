import React from "react";
import type { HangData as ApiHangData, HangSessionRecord } from "@sendtally/api-client";
import { hangModel, type HangActions } from "@sendtally/features/hang";
import { libraryOf } from "@sendtally/features/workouts";
import { HangDataContext } from "./HangDataContext";

export const TODAY = "2026-09-29";

export function hangData(overrides: Partial<ApiHangData> = {}): ApiHangData {
  return {
    grips: [],
    defaultGrips: {},
    loads: {},
    sessions: [],
    settings: {
      units: "kg",
      theme: "gunmetal",
      reminders: false,
      reminderTime: "08:00",
      postToStrava: false,
      reminderPromptSeen: true,
    },
    strava: { connected: false },
    ...overrides,
  };
}

/** A completed 6 × 10s max hang on a 20 mm half crimp, at bodyweight unless told. */
export const aHang = (over: Partial<HangSessionRecord> = {}): HangSessionRecord => ({
  id: `h-${over.gripId ?? "half"}-${over.date ?? "2026-09-20"}`,
  workoutId: "fingers-ab",
  gripId: "half",
  date: "2026-09-20",
  edgeMm: 20,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  protocol: {
    name: "Max hangs",
    kind: "hang",
    hangS: 10,
    restS: 0,
    reps: 1,
    sets: 6,
    setRestS: 180,
  },
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "t",
  ...over,
});

/** The signed-in user's training, as the provider hands it down, for a test. */
export function WithHang({
  data = hangData(),
  actions = {},
  children,
}: {
  data?: ApiHangData;
  actions?: Partial<HangActions>;
  children: React.ReactNode;
}): React.ReactElement {
  const value = React.useMemo(
    () => ({
      model: hangModel(data, libraryOf([])),
      actions: actions as HangActions,
      today: TODAY,
    }),
    [data, actions]
  );
  return <HangDataContext.Provider value={value}>{children}</HangDataContext.Provider>;
}
