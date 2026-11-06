import React from "react";
import { Pressable, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { Button } from "./Button";
import { HangIcon } from "./HangIcon";
import { IconButton } from "./IconButton";
import { Label } from "./Label";
import { Title } from "./Title";

export type SheetHeaderProps = {
  kicker: string;
  kickerColor?: string;
  title: string;
  action: string;
  onAction: () => void;
  /** Makes the title a link, a chevron after it. */
  onTitle?: () => void;
  /** Under the title, such as a planned run's day. */
  under?: React.ReactNode;
  /** A step inside the sheet: a chevron back to the one before it. */
  onBack?: () => void;
};

export function SheetHeader({
  kicker,
  kickerColor = colors.textSecondary,
  title,
  action,
  onAction,
  onTitle,
  under,
  onBack,
}: SheetHeaderProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        paddingTop: 6,
      }}
    >
      {onBack !== undefined && (
        <View style={{ marginLeft: -10 }}>
          <IconButton
            icon="back"
            label={t("common.back")}
            onPress={onBack}
            color={colors.gunmetal}
          />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Label color={kickerColor}>{kicker}</Label>
        {onTitle === undefined ? (
          <Title size={26}>{title}</Title>
        ) : (
          <Pressable
            onPress={onTitle}
            accessibilityRole="link"
            style={press({ flexDirection: "row", alignItems: "center", gap: 6 })}
          >
            <Title size={26} style={{ flexShrink: 1 }}>
              {title}
            </Title>
            <HangIcon name="forward" color={colors.textMuted} size={18} strokeWidth={2.2} />
          </Pressable>
        )}
        {under}
      </View>
      <Button label={action} onPress={onAction} variant="link" height={44} />
    </View>
  );
}
