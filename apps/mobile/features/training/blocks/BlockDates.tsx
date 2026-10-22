import React from "react";
import { Text } from "react-native";
import type { TrainingBlock } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";
import { blockDates } from "./blockText";

export type BlockDatesProps = { block: TrainingBlock };

/** Where a plan's Starts and Ends go when its block sets them. */
export function BlockDates({ block }: BlockDatesProps): React.ReactElement {
  return (
    <SheetSection label={t("plan.inBlock", { name: block.name })}>
      <Text style={[type.mono, { fontSize: 14, color: colors.gunmetal }]}>{blockDates(block)}</Text>
    </SheetSection>
  );
}
