import React from "react";
import type { Occurrence } from "@sendtally/features/training";
import { usePlanActions } from "../plan/usePlanActions";
import { isOneOff } from "./dayRows";
import { MoveSheet } from "./MoveSheet";
import { SkipSheet } from "./SkipSheet";

type Opened = { kind: "move" | "skip"; occurrence: Occurrence; name: string };

/** One planned run's Move or Skip sheet, opened from wherever the run shows, and Remove for a one-off. */
export function useDayChanges(): {
  open: (kind: Opened["kind"], occurrence: Occurrence, name: string) => void;
  sheets: React.ReactElement | null;
  remove: (occurrence: Occurrence) => (() => void) | undefined;
} {
  const actions = usePlanActions();
  const [opened, setOpened] = React.useState<Opened | null>(null);
  const close = (): void => setOpened(null);
  const sheets =
    opened === null ? null : opened.kind === "move" ? (
      <MoveSheet occurrence={opened.occurrence} name={opened.name} onClose={close} />
    ) : (
      <SkipSheet occurrence={opened.occurrence} name={opened.name} onClose={close} />
    );
  return {
    open: (kind, occurrence, name) => setOpened({ kind, occurrence, name }),
    sheets,
    remove: ({ membership }) =>
      isOneOff(membership) ? () => void actions.deleteMembership(membership.id) : undefined,
  };
}
