import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { MenuRow } from "../../live-session/MenuRow";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import type { DetailMenuRow } from "./types";

export type DetailMenuProps = {
  rows: readonly DetailMenuRow[];
  /** Opened from elsewhere too, as a card tapped anywhere. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** A detail screen's ··· button and the sheet of its rarer actions, the destructive one last. */
export function DetailMenu({
  rows,
  open: shown,
  onOpenChange,
}: DetailMenuProps): React.ReactElement {
  const [own, setOwn] = React.useState(false);
  const open = shown ?? own;
  const setOpen = onOpenChange ?? setOwn;
  const close = (): void => setOpen(false);
  return (
    <>
      <IconButton
        icon="more"
        label={t("summary.more")}
        onPress={() => setOpen(true)}
        color={colors.gunmetal}
        iconSize={22}
      />
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
