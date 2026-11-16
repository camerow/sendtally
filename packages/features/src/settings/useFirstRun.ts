import { useQuery, useQueryClient, type FetchStatus } from "@tanstack/react-query";
import React from "react";
import type { ConnectionStatus, FirstRunStep, SendtallyApi } from "@sendtally/api-client";
import type { CalendarDate, Weekday } from "@sendtally/core/hang";
import { queries } from "../query";
import type { PlanActions } from "../training/usePlanActions";
import { toggleIn } from "../training/ladder";
import type { FirstRunSource } from "./firstRun";

/**
 * Whether first run shows: the cached or fetched status says so. Null only while the very first
 * fetch of an account with nothing cached is in flight; a failed or paused fetch reads as not
 * showing, as does a server without the field, so the app never waits on it.
 */
export function firstRunShows(
  data: Pick<ConnectionStatus, "firstRun"> | undefined,
  fetchStatus: FetchStatus
): boolean | null {
  if (data !== undefined) return data.firstRun === true;
  return fetchStatus === "fetching" ? null : false;
}

/** First run's gate, for the app shell. */
export function useFirstRun(api: SendtallyApi): boolean | null {
  const { data, fetchStatus } = useQuery(queries.status(api));
  return firstRunShows(data, fetchStatus);
}

type FirstRunEnd = Extract<FirstRunStep, { step: "finished" }>["endedAt"];

/** Where a step leaves to: the import, Plan once the days are saved, or Log after a skip. */
export type FirstRunExit = "import" | "plan" | "log";

export type FirstRunFlowOptions = {
  /** Back from an import, so on the days step. */
  imported: boolean;
  today: CalendarDate;
  newId: () => string;
  actions: Pick<PlanActions, "saveMembership">;
  go: (to: FirstRunExit) => void;
  /** After the days are saved, as the phone asks about reminders. */
  onPlanned?: () => void;
};

export type FirstRunFlow = {
  step: 1 | 2;
  source: FirstRunSource | null;
  pick: (source: FirstRunSource) => void;
  days: readonly Weekday[];
  toggleDay: (day: Weekday) => void;
  /** The main button of step 1: import from the source, or on to the days. */
  next: () => void;
  later: () => void;
  skip: () => void;
  /** Saves the days as one Ongoing Climbing week, nothing with none picked, and ends on Plan. */
  saveDays: () => void;
};

/** The two steps of first run, the same on both apps; each app draws them and says where `go` goes. */
export function useFirstRunFlow(
  api: SendtallyApi,
  { imported, today, newId, actions, go, onPlanned }: FirstRunFlowOptions
): FirstRunFlow {
  const client = useQueryClient();
  const [source, setSource] = React.useState<FirstRunSource | null>(null);
  const [onDays, setOnDays] = React.useState(false);
  const [days, setDays] = React.useState<readonly Weekday[]>([]);
  const step = onDays || imported ? 2 : 1;

  const send = React.useCallback(
    (to: FirstRunStep): void => void api.firstRunStep(to).catch(() => undefined),
    [api]
  );
  React.useEffect(() => {
    if (!imported) send({ step: "started" });
  }, [send, imported]);

  const leaveLog = (): void => send({ step: "log_answered", existingLog: source ?? "skipped" });

  const end = (endedAt: FirstRunEnd, climbingDays: number): void => {
    const { queryKey } = queries.status(api);
    client.setQueryData(queryKey, (status) => status && { ...status, firstRun: false });
    send({ step: "finished", climbingDays, endedAt });
    go(endedAt === "plan" ? "plan" : "log");
  };

  return {
    step,
    source,
    pick: setSource,
    days,
    toggleDay: (day) => setDays(toggleIn(days, day)),
    next: () => {
      leaveLog();
      if (source === null || source === "none") setOnDays(true);
      else go("import");
    },
    later: () => {
      leaveLog();
      setOnDays(true);
    },
    skip: () => end(step === 1 ? "skip_log" : "skip_days", 0),
    saveDays: () => {
      if (days.length > 0) {
        void actions.saveMembership({
          id: newId(),
          workoutId: "climb-session",
          blockId: null,
          weekdays: [...days],
          start: today,
          position: 0,
        });
        onPlanned?.();
      }
      end("plan", days.length);
    },
  };
}
