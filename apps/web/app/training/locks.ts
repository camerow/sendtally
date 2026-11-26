import { useNavigate } from "react-router";
import { useMembership } from "@sendtally/features/billing";
import { useExercises } from "@sendtally/features/statistics";
import { dayLocked, locks, type LockSource, type Locks } from "@sendtally/features/training";
import type { MoreMenuItem } from "../components/MoreMenu";
import { useAppApi } from "../lib/useAppApi";
import { useLibrary, workoutIn } from "./library/useLibrary";

/** Where every locked press goes, saying where it was. */
export const membershipPagePath = (source: LockSource): string =>
  `/app/membership?source=${source}`;

/** What this account cannot open. */
export function useLocks(): Locks {
  const api = useAppApi();
  return locks(useMembership(api).access, useExercises(api).state);
}

/** A ··· item that makes something: while making is locked, it wears the lock and opens the Membership page instead. */
export function useCreateGate(source: LockSource): (item: MoreMenuItem) => MoreMenuItem {
  const locked = useLocks().create;
  const navigate = useNavigate();
  return (item) =>
    locked ? { ...item, locked, onSelect: () => void navigate(membershipPagePath(source)) } : item;
}

export function useDayLock(): { row: ReturnType<typeof dayLocked>; join: () => void } {
  const navigate = useNavigate();
  return {
    row: dayLocked(useLocks(), workoutIn(useLibrary())),
    join: () => void navigate(membershipPagePath("plan_day")),
  };
}
