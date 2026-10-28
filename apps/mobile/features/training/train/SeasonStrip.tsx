import React from "react";
import { Text, View } from "react-native";
import { addDays, blockEnd, type Block, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { focusLabel } from "@sendtally/features/training";
import { Label } from "../components/Label";
import { type } from "../type";

export type SeasonStripProps = { blocks: readonly Block[]; today: CalendarDate };

/** The blocks in order as phases, each as long as its weeks and named by its focus, the running one filled. */
export function SeasonStrip({ blocks, today }: SeasonStripProps): React.ReactElement | null {
  const phases = [...blocks].sort((a, b) => a.start.localeCompare(b.start));
  const first = phases[0];
  const last = phases.at(-1);
  if (first === undefined || last === undefined || phases.length < 2) return null;
  return (
    <View
      accessible
      accessibilityLabel={`${t("focus.season")}: ${phases
        .map((b) => `${b.name}, ${focusLabel(b.focus)}`)
        .join("; ")}`}
      style={{ gap: 6 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <Label color={colors.gunmetal}>{t("focus.season")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("plan.blockDates", {
            start: shortDate(first.start),
            last: shortDate(addDays(blockEnd(last), -1)),
          })}
        </Text>
      </View>
      <View
        style={{ flexDirection: "row", gap: 2, height: 28, borderRadius: 8, overflow: "hidden" }}
      >
        {phases.map((b) => {
          const now = b.start <= today && today < blockEnd(b);
          return (
            <View
              key={b.id}
              style={{
                flex: b.weeks,
                justifyContent: "center",
                paddingHorizontal: 6,
                backgroundColor: now ? colors.gunmetal : colors.surfaceSoft,
              }}
            >
              <Text
                numberOfLines={1}
                style={[
                  type.bodyBold,
                  {
                    fontSize: 11,
                    textAlign: "center",
                    color: now
                      ? colors.white
                      : blockEnd(b) <= today
                        ? colors.textMuted
                        : colors.gunmetal,
                  },
                ]}
              >
                {focusLabel(b.focus)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
