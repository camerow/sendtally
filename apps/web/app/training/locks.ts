import { useNavigate } from "react-router";
import { useMembership } from "@sendtally/features/billing";
import { useExerciseList } from "@sendtally/features/exercises";
import { locks, type LockSource, type Locks } from "@sendtally/features/training";
import type { MoreMenuItem } from "../components/MoreMenu";
import { useAppApi } from "../lib/useAppApi";

/** Where every locked press goes, saying where it was. */
export const joinPath = (source: LockSource): string => `/app/membership?source=${source}`;

/** What this account cannot open; nothing while access is still loading. */
export function useLocks(): Locks {
  const api = useAppApi();
  return locks(useMembership(api).access !== false, useExerciseList(api));
}

/** A ··· item that makes something: while making is locked, it wears the lock and opens the Membership page instead. */
export function useCreateGate(source: LockSource): (item: MoreMenuItem) => MoreMenuItem {
  const locked = useLocks().create;
  const navigate = useNavigate();
  return (item) =>
    locked ? { ...item, locked, onSelect: () => void navigate(joinPath(source)) } : item;
}
