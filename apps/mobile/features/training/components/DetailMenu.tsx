import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { MenuRow } from "../../live-session/MenuRow";
import { Button } from "./Button";
import { IconButton, type IconButtonProps } from "./IconButton";
import type { DetailMenuRow } from "./types";

export type DetailMenuProps = {
  rows: readonly DetailMenuRow[];
  /** Opened from elsewhere too, as a card tapped anywhere. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The ··· button's look, smaller on a card than in a header. */
  button?: Pick<IconButtonProps, "label" | "color" | "size" | "iconSize">;
};

/** A detail screen's ··· button and the sheet of its rarer actions, the destructive one last. */
export function DetailMenu({
  rows,
  open: shown,
  onOpenChange,
  button = { label: t("summary.more"), color: colors.gunmetal, iconSize: 22 },
}: DetailMenuProps): React.ReactElement {
  const [own, setOwn] = React.useState(false);
  const open = shown ?? own;
  const setOpen = onOpenChange ?? setOwn;
  const close = (): void => setOpen(false);
  return (
    <>
      <IconButton icon="more" onPress={() => setOpen(true)} {...button} />
      <Sheet visible={open} onClose={close} closeLabel={t("common.cancel")}>
        <View style={{ gap: 4, paddingTop: 4, paddingHorizontal: 12 }}>
          {rows.map(({ keepOpen = false, onPress, ...row }) => (
            <MenuRow
              key={row.title}
              {...row}
              onPress={() => {
                if (!keepOpen) close();
                onPress();
              }}
            />
          ))}
          <Button
            label={t("common.cancel")}
            onPress={close}
            variant="outline"
            height={52}
            style={{ marginTop: 6 }}
          />
        </View>
      </Sheet>
    </>
  );
}
