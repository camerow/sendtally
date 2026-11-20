import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { OnboardingPath, Wizard } from "@sendtally/features/settings";
import { displayGrade } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import { Icon } from "../../components/Icon";
import { Pyramid } from "../../components/Pyramid";
import { press } from "../../lib/press";
import { Label } from "../training/components/Label";
import { Title } from "../training/components/Title";
import { DayCell } from "../training/plan/DayCell";
import { WizardFrame } from "./WizardFrame";

const PYRAMID = [
  { value: 6, inner: 1, outer: 0 },
  { value: 5, inner: 2, outer: 1 },
  { value: 4, inner: 4, outer: 0 },
  { value: 3, inner: 5, outer: 0 },
];

const WEEK: readonly ("strength" | "hangboard" | null)[] = [
  null,
  "strength",
  null,
  "strength",
  null,
  "hangboard",
  null,
];

/** Two doors, each with a small picture of what its path builds. */
export function ChooserStep({ wizard }: { wizard: Wizard }): React.ReactElement {
  const scales = useDisplayScales();
  const letters = weekdayLetters();
  const doors: { path: OnboardingPath; title: string; body: string; art: React.ReactNode }[] = [
    {
      path: "history",
      title: t("onboarding.chooser.historyTitle"),
      body: t("onboarding.chooser.historyBody"),
      art: (
        <Pyramid
          label={t("trends.gradePyramid")}
          rows={PYRAMID.map(({ value, inner, outer }) => ({
            gradeLabel: displayGrade({ scale: "v", value }, scales),
            inner,
            outer,
            countLabel: `${inner}/${inner + outer}`,
          }))}
        />
      ),
    },
    {
      path: "plan",
      title: t("onboarding.chooser.planTitle"),
      body: t("onboarding.chooser.planBody"),
      art: (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {WEEK.map((kind, i) => (
            <View key={i} style={{ alignItems: "center", gap: 6 }}>
              <DayCell kind={kind ?? "strength"} on={kind !== null} size={36} />
              <Label small color={colors.textSecondary}>
                {letters[i]}
              </Label>
            </View>
          ))}
        </View>
      ),
    },
  ];
  return (
    <WizardFrame wizard={wizard}>
      <Title size={34}>{t("onboarding.chooser.title")}</Title>
      {doors.map((d) => (
        <Pressable
          key={d.path}
          accessibilityRole="button"
          accessibilityLabel={d.title}
          onPress={() => wizard.choose(d.path, "chooser")}
          style={press({
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
            borderRadius: radius.panel,
            overflow: "hidden",
          })}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              height: 140,
              justifyContent: "center",
              paddingVertical: 16,
              paddingHorizontal: 18,
              backgroundColor: colors.surfaceSoft,
            }}
          >
            {d.art}
          </View>
          <View style={{ gap: 4, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Title size={22}>{d.title}</Title>
              <Icon name="chevron" size={18} strokeWidth={2.2} color={colors.gunmetal} />
            </View>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary }}>
              {d.body}
            </Text>
          </View>
        </Pressable>
      ))}
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 12,
          color: colors.textMuted,
          textAlign: "center",
        }}
      >
        {t("onboarding.chooser.otherAfter")}
      </Text>
    </WizardFrame>
  );
}
