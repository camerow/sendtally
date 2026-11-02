import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { Switch } from "../../components/Switch";
import { bodyText } from "../../lib/styles";

const rowTitle = { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gunmetal } as const;

export type SwitchRowProps = {
  title: string;
  body: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
};

/** A ruled settings row: what it is, what it does, and its switch. */
export function SwitchRow({
  title,
  body,
  checked,
  disabled,
  onChange,
}: SwitchRowProps): React.ReactElement {
  return (
    <>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnLight }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, minHeight: 44 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={rowTitle}>{title}</Text>
          <Text style={bodyText}>{body}</Text>
        </View>
        <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
      </View>
    </>
  );
}
