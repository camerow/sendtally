import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { BlockRecap } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";
import { BlockWeekBars } from "../training/blocks/BlockWeekBars";
import { Label } from "../training/components/Label";
import { ON_DARK, ON_DARK_MUTED } from "../training/components/onDark";
import { type } from "../training/type";

const CARD_HEIGHT = 82;
const MARGIN = 8;

export const BLOCK_DONE_ROW_HEIGHT = CARD_HEIGHT + MARGIN * 2;

export type BlockDoneRowProps = { recap: BlockRecap; onPress: () => void };

/** A block finished, on its last day in the log: its name, what got done, and a bar per week. */
export function BlockDoneRow({ recap, onPress }: BlockDoneRowProps): React.ReactElement {
  const { block } = recap;
  const meta = [
    t("calendar.weeks", { count: block.weeks }),
    t("plan.doneOf", { done: recap.done, planned: recap.planned }),
  ].join(" · ");
  return (
    <View style={{ paddingHorizontal: 18, paddingVertical: MARGIN }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${t("plan.blockFinished")}, ${block.name}, ${meta}`}
        style={pressRow({
          height: CARD_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.gunmetal,
        })}
      >
        <View
          style={{
            position: "absolute",
            top: -60,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: colors.gold,
            opacity: 0.14,
          }}
        />
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.gold,
          }}
        >
          <Icon name="projects" size={18} strokeWidth={2} color={colors.gunmetal} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Label small color={colors.gold}>
            {t("plan.blockFinished")}
          </Label>
          <Text
            numberOfLines={1}
            style={[type.display, { fontSize: 19, lineHeight: 22, color: ON_DARK }]}
          >
            {block.name}
          </Text>
          <Text numberOfLines={1} style={[type.mono, { fontSize: 11, color: ON_DARK_MUTED }]}>
            {meta}
          </Text>
        </View>
        <BlockWeekBars weeks={recap.weeks} compact />
      </Pressable>
    </View>
  );
}
