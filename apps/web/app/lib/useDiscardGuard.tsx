import React from "react";
import { useBeforeUnload, useBlocker } from "react-router";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../components/Sheet";

export type DiscardGuard = {
  /** Lets the page go without asking; a save calls it before it navigates away. */
  release: () => void;
  /** Asks before `discard` runs, as the Cancel of an Edit mode that stays on its page. */
  ask: (discard: () => void) => void;
  /** The dialog that asks, rendered once on the page. */
  sheet: React.ReactNode;
};

/**
 * Asks before a page with unsaved changes is left, however it is left: Cancel, a link, the
 * browser's back. A reload or a closed tab gets the browser's own prompt.
 */
export function useDiscardGuard(dirty: boolean): DiscardGuard {
  const released = React.useRef(false);
  const [asked, setAsked] = React.useState<(() => void) | null>(null);
  const guarded = (): boolean => dirty && !released.current;
  const blocker = useBlocker(guarded);
  useBeforeUnload((event) => {
    if (guarded()) event.preventDefault();
  });
  const blocked = blocker.state === "blocked";
  return {
    release: () => {
      released.current = true;
    },
    ask: (discard) => setAsked(() => discard),
    sheet: (
      <Sheet
        open={blocked || asked !== null}
        title={t("workouts.discardChangesTitle")}
        onClose={() => {
          setAsked(null);
          if (blocked) blocker.reset();
        }}
        action={{
          label: t("common.discard"),
          danger: true,
          onPress: () => {
            asked?.();
            setAsked(null);
            if (blocked) blocker.proceed();
          },
        }}
      />
    ),
  };
}
