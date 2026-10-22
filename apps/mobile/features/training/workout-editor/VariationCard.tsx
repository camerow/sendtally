import React from "react";
import { View } from "react-native";
import type { Variation } from "@sendtally/core/hang";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { IconButton } from "../components/IconButton";
import { letterOf } from "./editorState";
import { ItemList, type ItemListProps } from "./ItemList";
import { LetterBadge } from "./LetterBadge";

export type VariationCardProps = Omit<ItemListProps, "items"> & {
  index: number;
  variation: Variation;
  onLabel: (label: string) => void;
  /** Absent while it is one of only two. */
  onRemove?: () => void;
};

/** One variation of an alternating workout: its letter, what it is called, and its items. */
export function VariationCard({
  index,
  variation,
  onLabel,
  onRemove,
  ...list
}: VariationCardProps): React.ReactElement {
  const letter = letterOf(index);
  return (
    <View
      style={{
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <LetterBadge variation={index} size={28} />
        <TextInput
          value={variation.label}
          onChangeText={onLabel}
          placeholder={t("workouts.variationPlaceholder")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("workouts.variationName", { letter })}
          maxLength={40}
          style={{
            flex: 1,
            height: 40,
            fontFamily: fonts.monoSemiBold,
            fontSize: 16,
            color: colors.gunmetal,
          }}
        />
        {onRemove !== undefined && (
          <IconButton
            icon="x"
            label={t("workouts.removeVariation", { letter })}
            onPress={onRemove}
            color={colors.textSecondary}
            size={36}
          />
        )}
      </View>
      <ItemList items={variation.items} {...list} />
    </View>
  );
}
