import React from "react";
import { Pressable, Text, View } from "react-native";
import { effortWord } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";

export type FinishSheetProps = {
  visible: boolean;
  summary: string;
  saving: boolean;
  failed: boolean;
  onSave: (rpe: number | null) => void;
  onDiscard: () => void;
  onClose: () => void;
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** One question on the way out: effort. Skipping it lets the session rate itself. */
export function FinishSheet({
  visible,
  summary,
  saving,
  failed,
  onSave,
  onDiscard,
  onClose,
}: FinishSheetProps): React.ReactElement {
  const [rpe, setRpe] = React.useState<number | null>(null);
  const hint =
    rpe === null ? t("tally.skipEffort") : `${rpe} · ${effortWord(rpe)}. ${t("tally.skipEffort")}`;
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 18, paddingHorizontal: 18, paddingBottom: 8 }}>
        <View style={{ gap: 4 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fonts.displayHeavy,
              fontSize: 28,
              letterSpacing: -0.8,
              color: colors.gunmetal,
            }}
          >
            {t("tally.howHard")}
          </Text>
          <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary }}>
            {summary}
          </Text>
        </View>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={t("common.effort")}
          style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 64 }}
        >
          {LEVELS.map((n) => (
            <Pressable
              key={n}
              onPress={() => setRpe((r) => (r === n ? null : n))}
              accessibilityRole="button"
              accessibilityState={{ selected: rpe === n }}
              accessibilityLabel={`${n}, ${effortWord(n)}`}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
            >
              <View
                style={{
                  width: "100%",
                  height: n * 4 + 8,
                  borderRadius: 4,
                  backgroundColor:
                    rpe !== null && n <= rpe ? colors.gunmetal : "rgba(64,63,76,0.15)",
                }}
              />
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.gunmetal }}>
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
          {hint}
        </Text>
        {failed && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
            {t("tally.finishFailed")}
          </Text>
        )}
        <Pressable
          onPress={() => onSave(rpe)}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          style={press({
            height: 54,
            borderRadius: radius.card,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.gunmetal,
            opacity: saving ? 0.6 : 1,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.white }}>
            {saving ? t("common.saving") : t("common.save")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDiscard}
          accessibilityRole="button"
          style={press({ height: 44, alignItems: "center", justifyContent: "center" })}
        >
          <Text
            style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.watermelonInk }}
          >
            {t("tally.discardSession")}
          </Text>
        </Pressable>
      </View>
    </Sheet>
  );
}
