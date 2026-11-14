import React from "react";
import { Pressable, Text, View } from "react-native";
import { press } from "../../lib/press";
import { underlineLabel, underlinePress } from "../../lib/styles";
import { Label } from "../training/components/Label";
import { AMBER } from "../training/components/tints";

const PREVIEW = 3;

/** An amber section of the review that shows its first three items, the rest on request. */
export function PreviewSection<T>({
  title,
  items,
  showAllLabel,
  children,
}: {
  title: string;
  items: T[];
  showAllLabel: string;
  children: (shown: T[]) => React.ReactNode;
}): React.ReactElement {
  const [all, setAll] = React.useState(false);
  return (
    <View>
      <View style={{ minHeight: 36, justifyContent: "center" }}>
        <Label color={AMBER}>{title}</Label>
      </View>
      {children(all ? items : items.slice(0, PREVIEW))}
      {!all && items.length > PREVIEW && (
        <Pressable
          onPress={() => setAll(true)}
          accessibilityRole="button"
          style={press(underlinePress)}
        >
          <Text style={underlineLabel}>{showAllLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
