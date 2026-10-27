import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ClimbDetailScreen } from "../../features/climbs/ClimbDetailScreen";

export default function ClimbScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ClimbDetailScreen id={id ?? ""} />;
}
