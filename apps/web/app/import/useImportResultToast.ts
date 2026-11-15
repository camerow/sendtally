import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { importResultText, readImportResult } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { useToast } from "../components/Toast";

/** What an import just added, from the params it came back with, shown once with a way to see them. */
export function useImportResultToast(): void {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  React.useEffect(() => {
    const result = readImportResult((k) => params.get(k));
    if (result === null) return;
    toast.show({
      message: importResultText(result),
      ...(result.imported > 0 && {
        action: { label: t("common.view"), onPress: () => void navigate("/app") },
      }),
    });
    setParams({}, { replace: true });
  }, [params, setParams, toast, navigate]);
}
