import React from "react";
import { View } from "react-native";
import { kindLabel } from "@sendtally/features/activities";
import { hasAbout, type About } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { Sheet } from "../../../components/Sheet";
import { Description } from "./Description";
import { IconButton } from "./IconButton";
import { SheetHeader } from "./SheetHeader";

export type { About };

export type AboutButtonProps = {
  about: About | undefined;
  /** What the button says to a screen reader. */
  label: string;
  color: string;
};

/** An info button beside a name, opening its pictures and description in a sheet; none without either. */
export function AboutButton({ about, label, color }: AboutButtonProps): React.ReactElement | null {
  const [open, setOpen] = React.useState(false);
  if (!hasAbout(about)) return null;
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
      <Sheet visible={open} onClose={close} closeLabel={t("common.done")} hero={about.pictures}>
        <View style={{ gap: 12, paddingHorizontal: 18, paddingBottom: 12 }}>
          <SheetHeader
            kicker={kindLabel(about.kind)}
            kickerColor={KIND_LOOK[about.kind].ink}
            title={about.name}
            action={t("common.done")}
            onAction={close}
          />
          {about.description !== "" && <Description text={about.description} />}
        </View>
      </Sheet>
    </>
  );
}
