import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ProjectsContent } from "../../features/projects/ProjectsContent";

export default function Projects(): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ProjectsContent
        header={(caption) => <ScreenHeader title={t("common.projects")} caption={caption} />}
      />
    </SafeAreaView>
  );
}
