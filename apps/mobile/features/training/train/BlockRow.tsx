import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Lock } from "../../../components/Lock";
import { pressRow } from "../../../lib/press";
import { openBlock } from "../blocks/openBlock";
import { HangIcon } from "../components/HangIcon";
import { holdProps } from "../components/holdProps";
import type { LongPress } from "../components/types";
import { type } from "../type";

export type BlockRowProps = {
  id: string;
  name: string;
  meta?: string;
  /** What back says on the block: the screen the row is on. */
  back: string;
  /** In place of opening the block. */
  onPress?: () => void;
  /** Members only: the name muted and the lock in place of the chevron. */
  locked?: boolean;
  hold?: LongPress;
};

/** A block in the list: its name and when, opening the block. */
export function BlockRow({
  id,
  name,
  meta,
  back,
  onPress,
  locked = false,
  hold,
}: BlockRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress ?? (() => openBlock(id, back))}
      accessibilityRole="button"
      accessibilityLabel={
        locked ? t("common.membersOnly", { label: name }) : t("plan.openBlock", { name })
      }
      {...holdProps(hold)}
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
        <Text
          style={[
            type.bodyBold,
            { fontSize: 16, color: locked ? colors.textMuted : colors.gunmetal },
          ]}
        >
          {name}
        </Text>
        {meta !== undefined && (
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
        )}
      </View>
      {locked ? (
        <Lock />
      ) : (
        <HangIcon name="forward" color={colors.textSecondary} size={16} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}
