import { router } from "expo-router";
import { useExercises } from "@sendtally/features/statistics";
import { dayLocked, locks, type LockSource, type Locks } from "@sendtally/features/training";
import { useApi } from "../../lib/api";
import { useBilling } from "../billing/useBilling";
import type { DetailMenuRow } from "./components/types";
import { useLibrary } from "./library/useLibrary";

/** Where every locked press goes, saying where it was. */
export const openMembershipPage = (source: LockSource): void =>
  router.push({ pathname: "/membership", params: { source } });

/** What this account cannot open. */
export const useLocks = (): Locks =>
  locks(useBilling()?.membership.access ?? null, useExercises(useApi()).state);

/** A ··· row that makes something: while making is locked, it wears the lock and opens the Membership page instead. */
export function useCreateGate(source: LockSource): (row: DetailMenuRow) => DetailMenuRow {
  const locked = useLocks().create;
  return (row) =>
    locked ? { ...row, locked, keepOpen: false, onPress: () => openMembershipPage(source) } : row;
}

export function useDayLock(): { row: ReturnType<typeof dayLocked>; join: () => void } {
  const library = useLibrary().state;
  return {
    row: dayLocked(useLocks(), (id) =>
      library.status === "ready" ? library.data.workout(id) : undefined
    ),
    join: () => openMembershipPage("plan_day"),
  };
}
