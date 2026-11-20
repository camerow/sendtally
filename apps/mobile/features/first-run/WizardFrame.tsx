import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { Wizard } from "@sendtally/features/onboarding";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../components/ScreenFrame";
import { Button } from "../training/components/Button";
import { IconButton } from "../training/components/IconButton";

export type WizardFrameProps = {
  wizard: Wizard;
  children: React.ReactNode;
  /** The step's primary button, pinned under the body. */
  footer?: React.ReactNode;
};

/** Every wizard step: Back and the path's progress once a path is chosen, Skip top right always. */
export function WizardFrame({ wizard, children, footer }: WizardFrameProps): React.ReactElement {
  const inPath = wizard.step !== "choose";
  const { n, total } = wizard.position;
  return (
    <ScreenFrame
      footer={footer}
      header={
        <View
          style={{
            height: 48,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingLeft: 6,
            paddingRight: 10,
          }}
        >
          {inPath && (
            <>
              {wizard.canGoBack && (
                <IconButton
                  icon="back"
                  label={t("common.back")}
                  onPress={wizard.back}
                  color={colors.gunmetal}
                />
              )}
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={t("onboarding.firstRun.step", { n, total })}
                style={{ flex: 1, flexDirection: "row", gap: 4 }}
              >
                {Array.from({ length: total }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: i < n ? colors.gunmetal : colors.dataBarEmpty,
                    }}
                  />
                ))}
              </View>
            </>
          )}
          <Button
            variant="link"
            height={44}
            label={t("onboarding.firstRun.skip")}
            onPress={wizard.skip}
            style={{ marginLeft: "auto", paddingHorizontal: 8 }}
          />
        </View>
      }
    >
      {children}
    </ScreenFrame>
  );
}
