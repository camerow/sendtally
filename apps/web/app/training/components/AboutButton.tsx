import React from "react";
import { kindLabel } from "@sendtally/features/activities";
import { hasAbout, type About } from "@sendtally/features/exercises";
import { KIND_LOOK } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { Description } from "./Description";

export type { About };

export type AboutButtonProps = {
  about: About | undefined;
  /** What the button says to a screen reader. */
  label: string;
  /** On the dark timer, in its softer ink. */
  dark?: boolean;
};

/** An info button beside a name, opening its picture and description in a sheet; none without either. */
export function AboutButton({
  about,
  label,
  dark = false,
}: AboutButtonProps): React.ReactElement | null {
  const [open, setOpen] = React.useState(false);
  if (!hasAbout(about)) return null;
  const picture = about.pictures[0];
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
        {...(picture !== undefined && { hero: picture })}
        onClose={() => setOpen(false)}
      >
        {about.description !== "" && (
          <div className="sheet-body">
            <Description text={about.description} />
          </div>
        )}
      </Sheet>
    </>
  );
}
