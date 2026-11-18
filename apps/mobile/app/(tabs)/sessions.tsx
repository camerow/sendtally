import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SessionsLog } from "../../features/sessions/SessionsLog";

export default function Log(): React.ReactElement {
  const { workout } = useLocalSearchParams<{ workout?: string }>();
  return <SessionsLog workout={workout ?? null} />;
}
