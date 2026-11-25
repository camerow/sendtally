import { router } from "expo-router";
import { useExerciseList } from "@sendtally/features/exercises";
import { locks, type LockSource, type Locks } from "@sendtally/features/training";
import { useApi } from "../../lib/api";
import { useBilling } from "../billing/useBilling";
import type { DetailMenuRow } from "./components/types";

/** Where every locked press goes, saying where it was. */
export const openMembershipPage = (source: LockSource): void =>
  router.push({ pathname: "/membership", params: { source } });

/** In place of a page that is locked, so Back returns to where it was opened from. */
export const replaceWithMembershipPage = (source: LockSource): void =>
  router.replace({ pathname: "/membership", params: { source } });

/** What this account cannot open; nothing while access is still loading. */
export const useLocks = (): Locks =>
  locks(useBilling()?.membership.access !== false, useExerciseList(useApi()));

/** A ··· row wearing the lock, opening the Membership page in place of what it does. */
export const lockedRow = (row: DetailMenuRow, source: LockSource): DetailMenuRow => ({
  ...row,
  locked: true,
  keepOpen: false,
  onPress: () => openMembershipPage(source),
});
