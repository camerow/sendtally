import React from "react";
import { useNavigate } from "react-router";
import { t } from "@sendtally/features/i18n";
import { isOneOff, type Occurrence } from "@sendtally/features/training";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { usePlanActions } from "../data/usePlanActions";
import { MoveSheet } from "./MoveSheet";
import { SkipSheet } from "./SkipSheet";

type Opened = { kind: "move" | "skip"; occurrence: Occurrence; name: string };

/**
 * A planned run's ··· rows, as mobile lists them: Log it first on a missed day, then Reschedule
 * and Skip, and Remove last for a one-off; with the sheet the first two open.
 */
export function useDayChanges(): {
  items: (occurrence: Occurrence, name: string, logIt?: string | null) => MoreMenuItem[];
  sheets: React.ReactElement | null;
} {
  const navigate = useNavigate();
  const actions = usePlanActions();
  const [opened, setOpened] = React.useState<Opened | null>(null);
  const close = (): void => setOpened(null);
  return {
    items: (occurrence, name, logIt) => [
      ...(logIt == null
        ? []
        : [{ label: t("workouts.logIt"), onSelect: () => void navigate(logIt) }]),
      { label: t("plan.move"), onSelect: () => setOpened({ kind: "move", occurrence, name }) },
      { label: t("plan.skip"), onSelect: () => setOpened({ kind: "skip", occurrence, name }) },
      ...(isOneOff(occurrence.membership)
        ? [
            {
              label: t("plan.removeAction"),
              destructive: true,
              onSelect: () => void actions.deleteMembership(occurrence.membership.id),
            },
          ]
        : []),
    ],
    sheets:
      opened === null ? null : opened.kind === "move" ? (
        <MoveSheet occurrence={opened.occurrence} name={opened.name} onClose={close} />
      ) : (
        <SkipSheet occurrence={opened.occurrence} name={opened.name} onClose={close} />
      ),
  };
}
