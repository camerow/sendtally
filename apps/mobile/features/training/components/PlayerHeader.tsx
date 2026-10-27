import React from "react";
import { View } from "react-native";
import type { ActivityKind } from "@sendtally/api-client";
import { kindLabel } from "@sendtally/features/activities";
import { durationLabel } from "@sendtally/features/sessions";
import { BackButton } from "../../../components/BackButton";
import { KIND_LOOK } from "../today/kindLook";
import { Label } from "./Label";
import { Title } from "./Title";

export type PlayerHeaderProps = {
  kind: ActivityKind;
  title: string;
  minutes: number | null;
  /** What sits across from Back, such as the rest clock. */
  aside?: React.ReactNode;
};

/** Back, the workout's kind and length, and its name: the top of the sets and checklist players. */
export function PlayerHeader({
  kind,
  title,
  minutes,
  aside,
}: PlayerHeaderProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 44,
        }}
      >
        <BackButton />
        {aside}
      </View>
      <View style={{ gap: 4 }}>
        <Label color={KIND_LOOK[kind].ink}>
          {[kindLabel(kind), minutes === null ? null : durationLabel(minutes)]
            .filter((p) => p !== null)
            .join(" · ")}
        </Label>
        <Title size={32}>{title}</Title>
      </View>
    </View>
  );
}
