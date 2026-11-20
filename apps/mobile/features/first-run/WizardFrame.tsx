import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { Wizard } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../components/ScreenFrame";
import { Button } from "../training/components/Button";
import { IconButton } from "../training/components/IconButton";

export type WizardFrameProps = {
  wizard: Wizard;
  children: React.ReactNode;
  /** The step's primary button, pinned under the body. */
  footer?: React.ReactNode;
  /** The dark ground of a payoff screen, with its progress in gold. */
  dark?: boolean;
  /** Off on the steps past the payoff, where leaving early skips nothing. */
  skip?: boolean;
  /** Off for a closing screen with no back, progress or Skip. */
  bar?: boolean;
  /** Children of the body that stay pinned to the top once scrolled to. */
  sticky?: number[];
};

/** Every wizard step: Back and the path's progress once a path is chosen, Skip top right. */
export function WizardFrame({
  wizard,
  children,
  footer,
  dark = false,
  skip = true,
  bar = true,
  sticky,
}: WizardFrameProps): React.ReactElement {
  const inPath = wizard.step !== "choose";
  const { n, total } = wizard.position;
  const ink = dark ? colors.white : colors.gunmetal;
  return (
    <ScreenFrame
      footer={footer}
      dark={dark}
      {...(sticky === undefined ? {} : { sticky })}
      header={
        <View
          style={{
            height: bar ? 48 : 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingLeft: 6,
            paddingRight: 10,
          }}
        >
          {bar && inPath && (
            <>
              {wizard.canGoBack && (
                <IconButton
                  icon="back"
                  label={t("common.back")}
                  onPress={wizard.back}
                  color={ink}
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
                      backgroundColor:
                        i < n
                          ? dark
                            ? colors.gold
                            : colors.gunmetal
                          : dark
                            ? "rgba(255,255,255,0.18)"
                            : colors.dataBarEmpty,
                    }}
                  />
                ))}
              </View>
            </>
          )}
          {bar && skip ? (
            <Button
              variant="link"
              height={44}
              label={t("onboarding.firstRun.skip")}
              onPress={wizard.skip}
              style={{ marginLeft: "auto", paddingHorizontal: 8 }}
            />
          ) : (
            bar && <View style={{ width: 8 }} />
          )}
        </View>
      }
    >
      {children}
    </ScreenFrame>
  );
}
