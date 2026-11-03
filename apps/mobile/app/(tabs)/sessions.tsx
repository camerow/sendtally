import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SessionsLog } from "../../features/sessions/SessionsLog";
import { logSegmentStorage } from "../../lib/logSegmentStorage";
import { useSegmentParam } from "../../lib/storedSegment";

export default function Log(): React.ReactElement {
  const { segment, workout } = useLocalSearchParams<{ segment?: string; workout?: string }>();
  useSegmentParam(logSegmentStorage, segment);
  return <SessionsLog workout={workout ?? null} />;
}
