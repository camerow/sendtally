import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTrainingMode } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ProjectsContent } from "../../features/projects/ProjectsContent";
import { LogSegments, type LogSegment } from "../../features/sessions/LogSegments";
import { SessionsLog } from "../../features/sessions/SessionsLog";
import { useApi } from "../../lib/api";

export default function Log(): React.ReactElement {
  const api = useApi();
  const { enabled } = useTrainingMode(api);
  const [segment, setSegment] = React.useState<LogSegment>("sessions");
  const { add } = useLocalSearchParams<{ add?: string }>();
  const [seenAdd, setSeenAdd] = React.useState(add);
  if (add !== seenAdd) {
    setSeenAdd(add);
    if (add === "climb") setSegment("sessions");
  }
  const segments = enabled ? <LogSegments value={segment} onChange={setSegment} /> : null;

  if (!enabled || segment === "sessions")
    return <SessionsLog segments={segments} quickAdd={!enabled} />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("journal.log")} right={<AccountButton />} />
      {segments}
      <ProjectsContent />
    </SafeAreaView>
  );
}
