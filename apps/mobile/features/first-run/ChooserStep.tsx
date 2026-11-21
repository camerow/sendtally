import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { queries } from "@sendtally/features/query";
import { pathDone, SAMPLE_WEEK, type OnboardingPath } from "@sendtally/features/settings";
import { Icon } from "../../components/Icon";
import { DarkWeek } from "../../components/DarkWeek";
import { SamplePyramid } from "../../components/SamplePyramid";
import { press } from "../../lib/press";
import { Title } from "../training/components/Title";
import type { StepComponent } from "./types";
import { WizardFrame } from "./WizardFrame";

const WEEK = SAMPLE_WEEK.map((kind) => (kind === null ? null : [kind]));

/** Two doors, each with a small picture of what its path builds. */
export const ChooserStep: StepComponent = ({ wizard, api }) => {
  const progress = useQuery(queries.status(api)).data?.onboarding.progress;
  const doors: { path: OnboardingPath; title: string; body: string; art: React.ReactNode }[] = [
    {
      path: "history",
      title: t("onboarding.chooser.historyTitle"),
      body: t("onboarding.chooser.historyBody"),
      art: <SamplePyramid tone="dark" counts={false} />,
    },
    {
      path: "plan",
      title: t("onboarding.chooser.planTitle"),
      body: t("onboarding.chooser.planBody"),
      art: <DarkWeek week={WEEK} />,
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
              backgroundColor: colors.gunmetal,
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
            {progress !== undefined && pathDone(progress, d.path) && (
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.fern }}>
                {t("common.done")}
              </Text>
            )}
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
};
