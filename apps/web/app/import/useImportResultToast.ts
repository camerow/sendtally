import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { importResultText } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { useToast } from "../components/Toast";

/** What an import just added, from the params it came back with, shown once with a way to see them. */
export function useImportResultToast(): void {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  const imported = params.get("imported");
  React.useEffect(() => {
    if (imported === null) return;
    const result = {
      imported: Number(imported),
      skipped: Number(params.get("skipped") ?? 0),
      likely: Number(params.get("likely") ?? 0),
    };
    toast.show({
      message: importResultText(result),
      ...(result.imported > 0 && {
        action: { label: t("common.view"), onPress: () => void navigate("/app") },
      }),
    });
    setParams({}, { replace: true });
  }, [imported, params, setParams, toast, navigate]);
}
