import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { MembersGet as MembersGetView } from "@sendtally/features/billing";
import { YoursTag } from "../first-run/plan/components/YoursTag";
import { RestPreview } from "../training/rest/RestPreview";
import { type } from "../training/type";

export function SampleWorkout({ view }: { view: MembersGetView }): React.ReactElement {
  const [first, second] = view.exercises;
  const head = (e: MembersGetView["exercises"][number]): React.ReactElement => (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          numberOfLines={1}
          style={[
            type.bodyBold,
            { flexShrink: 1, fontSize: 15, lineHeight: 19, color: colors.gunmetal },
          ]}
        >
          {e.name}
        </Text>
        {e.yours && <YoursTag />}
      </View>
      <Text
        numberOfLines={1}
        style={[type.monoBold, { fontSize: 13, lineHeight: 17, color: colors.gunmetal }]}
      >
        {e.work}
      </Text>
    </View>
  );
  return (
    <>
      {head(first)}
      <RestPreview seconds={view.restS} />
      {head(second)}
    </>
  );
}
