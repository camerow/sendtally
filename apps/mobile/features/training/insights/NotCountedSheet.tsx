import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { WorkloadLeftOutVM } from "@sendtally/features/statistics";
import { Sheet } from "../../../components/Sheet";
import { type } from "../type";
import { NotCountedRows } from "./NotCountedRows";

/** The records in the range left out of the load, nothing else. */
export function NotCountedSheet({
  rows,
  visible,
  onClose,
}: {
  rows: WorkloadLeftOutVM[];
  visible: boolean;
  onClose: () => void;
}): React.ReactElement {
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.close")}>
      <View style={{ paddingHorizontal: 18, gap: 2 }}>
        <Text style={[type.display, { fontSize: 22, color: colors.gunmetal, marginBottom: 12 }]}>
          {t("statistics.loadTitle")}
        </Text>
        <NotCountedRows label={t("statistics.loadNotCountedTitle")} rows={rows} onOpen={onClose} />
      </View>
    </Sheet>
  );
}
