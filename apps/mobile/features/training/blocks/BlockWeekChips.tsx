import React from "react";
import { View } from "react-native";
import { blockWeekOn, type Block, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { KindTag } from "../components/KindTag";
import { FERN_TINT } from "../components/tints";

export type BlockWeekChipsProps = { block: Block; today: CalendarDate };

/** W1 to the last week: the weeks gone on fern, this one dark, the rest plain. */
export function BlockWeekChips({ block, today }: BlockWeekChipsProps): React.ReactElement {
  const now = blockWeekOn(block, today) ?? (today < block.start ? 0 : block.weeks + 1);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {Array.from({ length: block.weeks }, (_, i) => {
        const week = i + 1;
        const look =
          week < now
            ? { color: colors.fern, background: FERN_TINT }
            : week === now
              ? { color: colors.white, background: colors.gunmetal }
              : { color: colors.textSecondary, background: colors.surfaceSoft };
        return <KindTag key={week} label={t("plan.weekShort", { n: week })} {...look} />;
      })}
    </View>
  );
}
