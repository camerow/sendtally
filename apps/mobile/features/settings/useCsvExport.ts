import { Directory, File, Paths } from "expo-file-system";
import React from "react";
import { Platform, Share } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";

export type CsvExportFeature = {
  exportCsv: () => void;
  busy: boolean;
  message: string | null;
};

const FILE_NAME = "sendtally-export.csv";

function cancelled(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "code" in err && err.code === "ERR_PICKER_CANCELLED"
  );
}

async function shareFile(csv: string): Promise<boolean> {
  const file = new File(Paths.cache, FILE_NAME);
  file.write(csv);
  await Share.share({ url: file.uri });
  return false;
}

async function saveToFolder(csv: string): Promise<boolean> {
  const folder = await Directory.pickDirectoryAsync();
  folder.createFile(FILE_NAME, "text/csv").write(csv);
  return true;
}

/** iOS hands the file to the share sheet; Android has no file share without a native module, so it saves into a folder the user picks. */
export function useCsvExport(api: SendtallyApi): CsvExportFeature {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const exportCsv = React.useCallback((): void => {
    setBusy(true);
    setMessage(null);
    api
      .exportCsv()
      .then((csv) => (Platform.OS === "ios" ? shareFile(csv) : saveToFolder(csv)))
      .then((saved) => setMessage(saved ? t("settings.exportSaved") : null))
      .catch((err: unknown) => setMessage(cancelled(err) ? null : t("settings.exportFailed")))
      .finally(() => setBusy(false));
  }, [api]);

  return { exportCsv, busy, message };
}
