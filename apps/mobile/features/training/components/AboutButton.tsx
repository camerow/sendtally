import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { Sheet } from "../../../components/Sheet";
import { Description } from "./Description";
import { IconButton } from "./IconButton";
import { SheetHeader } from "./SheetHeader";

/** What an info sheet is about: a workout or an exercise. */
export type About = { kind: WorkoutKind; name: string; description: string };

export type AboutButtonProps = {
  about: About | undefined;
  /** What the button says to a screen reader. */
  label: string;
  color: string;
};

/** An info button beside a name, opening its description whole in a sheet; none without one. */
export function AboutButton({ about, label, color }: AboutButtonProps): React.ReactElement | null {
  const [open, setOpen] = React.useState(false);
  if (about === undefined || about.description === "") return null;
  const close = (): void => setOpen(false);
  return (
    <>
      <IconButton
        icon="info"
        label={label}
        onPress={() => setOpen(true)}
        color={color}
        size={28}
        iconSize={18}
      />
      <Sheet visible={open} onClose={close} closeLabel={t("common.done")}>
        <View style={{ gap: 12, paddingHorizontal: 18, paddingBottom: 12 }}>
          <SheetHeader
            kicker={kindLabel(about.kind)}
            kickerColor={KIND_LOOK[about.kind].ink}
            title={about.name}
            action={t("common.done")}
            onAction={close}
          />
          <Description text={about.description} />
        </View>
      </Sheet>
    </>
  );
}
