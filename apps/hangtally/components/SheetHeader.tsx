import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
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
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        paddingTop: 10,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Label color={c.ink2}>{kicker}</Label>
        <Title size={32} color={c.ink}>
          {title}
        </Title>
      </View>
      <Button label={action} onPress={onAction} variant="outlineLight" height={36} />
    </View>
  );
}
