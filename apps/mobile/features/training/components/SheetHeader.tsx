import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Button } from "./Button";
import { Label } from "./Label";
import { Title } from "./Title";

export type SheetHeaderProps = {
  kicker: string;
  title: string;
  action: string;
  onAction: () => void;
};

export function SheetHeader({
  kicker,
  title,
  action,
  onAction,
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
      <View style={{ flex: 1, gap: 4 }}>
        <Label color={colors.textSecondary}>{kicker}</Label>
        <Title size={26}>{title}</Title>
      </View>
      <Button label={action} onPress={onAction} variant="link" height={44} />
    </View>
  );
}
