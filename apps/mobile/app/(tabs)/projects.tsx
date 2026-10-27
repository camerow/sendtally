import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ClimbsContent } from "../../features/climbs/ClimbsContent";

export default function Climbs(): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ClimbsContent header={<ScreenHeader title={t("climbs.title")} />} />
    </SafeAreaView>
  );
}
