import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SessionsLog } from "../../features/sessions/SessionsLog";

export default function Log(): React.ReactElement {
  const { workout, status } = useLocalSearchParams<{ workout?: string; status?: string }>();
  const link = new URLSearchParams({
    ...(workout === undefined ? {} : { workout }),
    ...(status === undefined ? {} : { status }),
  }).toString();
  return <SessionsLog link={link === "" ? null : link} />;
}
