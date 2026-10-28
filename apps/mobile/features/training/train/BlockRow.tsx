import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Focus } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { FocusTag } from "../components/FocusTag";
import { HangIcon } from "../components/HangIcon";
import { type } from "../type";

export type BlockRowProps = {
  id: string;
  name: string;
  meta?: string;
  /** Its focus as a tag; none where the row does not say. */
  focus?: Focus | null;
};

/** A block in the list: its name and when, opening the block. */
export function BlockRow({ id, name, meta, focus }: BlockRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/plan/block/[id]", params: { id } })}
      accessibilityRole="button"
      accessibilityLabel={t("plan.openBlock", { name })}
      style={pressRow({
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 16, color: colors.gunmetal }]}>{name}</Text>
        {meta !== undefined && (
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
        )}
      </View>
      {focus !== undefined && <FocusTag focus={focus} />}
      <HangIcon name="forward" color={colors.textSecondary} size={16} strokeWidth={2.2} />
    </Pressable>
  );
}
