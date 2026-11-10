import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { OptionRow } from "../../../components/OptionRow";
import { HangSheet } from "../data/HangSheet";
import { SheetHeader } from "./SheetHeader";
import type { AddToOption } from "./types";

export type AddToSheetProps = {
  /** What is being added. */
  kicker: string;
  title: string;
  options: readonly AddToOption[];
  onPick: (option: AddToOption) => void;
  onClose: () => void;
};

/** Where to add a workout or an exercise: one tap adds it and closes; where it already is, is checked. */
export function AddToSheet({
  kicker,
  title,
  options,
  onPick,
  onClose,
}: AddToSheetProps): React.ReactElement {
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 12, paddingBottom: 12 }}>
        <SheetHeader kicker={kicker} title={title} action={t("common.cancel")} onAction={onClose} />
        <View>
          {options.map((o) => (
            <OptionRow
              key={o.id}
              label={o.label}
              {...(o.detail !== undefined && { detail: o.detail })}
              selected={o.there}
              mono={false}
              onPress={() => {
                if (o.there) return;
                onClose();
                onPick(o);
              }}
            />
          ))}
        </View>
      </View>
    </HangSheet>
  );
}
