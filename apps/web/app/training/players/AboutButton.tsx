import React from "react";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { KIND_LOOK } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { Description } from "../components/Description";

/** What an info sheet is about: a workout or an exercise. */
export type About = { kind: WorkoutKind; name: string; description: string };

export type AboutButtonProps = {
  about: About | undefined;
  /** What the button says to a screen reader. */
  label: string;
  /** On the dark timer, in its softer ink. */
  dark?: boolean;
};

/** An info button beside a name, opening its description whole in a sheet; none without one. */
export function AboutButton({
  about,
  label,
  dark = false,
}: AboutButtonProps): React.ReactElement | null {
  const [open, setOpen] = React.useState(false);
  if (about === undefined || about.description === "") return null;
  return (
    <>
      <button
        type="button"
        className={dark ? "player-info player-info--dark" : "player-info"}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Icon name="info" size={18} />
      </button>
      <Sheet
        open={open}
        kicker={kindLabel(about.kind)}
        kickerColor={KIND_LOOK[about.kind].ink}
        title={about.name}
        onClose={() => setOpen(false)}
      >
        <div className="sheet-body">
          <Description text={about.description} />
        </div>
      </Sheet>
    </>
  );
}
