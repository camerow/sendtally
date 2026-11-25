import { router } from "expo-router";
import { useExercises } from "@sendtally/features/statistics";
import { locks, type LockSource, type Locks } from "@sendtally/features/training";
import { useApi } from "../../lib/api";
import { useBilling } from "../billing/useBilling";
import type { DetailMenuRow } from "./components/types";

/** Where every locked press goes, saying where it was. */
export const openMembershipPage = (source: LockSource): void =>
  router.push({ pathname: "/membership", params: { source } });

/** What this account cannot open. */
export const useLocks = (): Locks =>
  locks(useBilling()?.membership.access ?? null, useExercises(useApi()).state);

/** A ··· row wearing the lock, opening the Membership page in place of what it does. */
export const lockedRow = (row: DetailMenuRow, source: LockSource): DetailMenuRow => ({
  ...row,
  locked: true,
  keepOpen: false,
  onPress: () => openMembershipPage(source),
});
