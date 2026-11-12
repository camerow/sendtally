import React from "react";
import { View } from "react-native";
import type { DatedBlock } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockDateRange } from "@sendtally/features/training";
import { RadioRow } from "./RadioRow";

export type BlockChoiceProps = {
  blocks: readonly DatedBlock[];
  value: string | null;
  onChange: (blockId: string | null) => void;
};

/** Which block a plan goes in, or none. */
export function BlockChoice({ blocks, value, onChange }: BlockChoiceProps): React.ReactElement {
  return (
    <View>
      {blocks.map((b) => (
        <RadioRow
          key={b.id}
          title={b.name}
          sub={blockDateRange(b)}
          on={value === b.id}
          onPress={() => onChange(b.id)}
        />
      ))}
      <RadioRow
        title={t("plan.noBlock")}
        sub={t("plan.noBlockHint")}
        on={value === null}
        onPress={() => onChange(null)}
      />
    </View>
  );
}
