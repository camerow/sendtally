import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { inputStyle } from "../styles";
import { AreaDialog } from "./AreaDialog";
import { Field } from "./Field";

export type ReportIssueDialogProps = {
  api: SendtallyApi;
  entityType: "area" | "climb";
  entityId: string;
  name: string;
  onClose: () => void;
  onReported: () => void;
};

export function ReportIssueDialog({
  api,
  entityType,
  entityId,
  name,
  onClose,
  onReported,
}: ReportIssueDialogProps): React.ReactElement {
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(): Promise<void> {
    if (body.trim() === "") return setError(t("areas.issueRequired"));
    setBusy(true);
    setError(null);
    try {
      await api.reportAreaIssue({ entityType, entityId, body: body.trim() });
      onReported();
    } catch {
      setBusy(false);
      setError(t("common.somethingWentWrongTryAgain"));
    }
  }

  return (
    <AreaDialog
      label={t("areas.reportIssue")}
      title={t("areas.whatsWrongWith", { name })}
      submitLabel={t("areas.sendReport")}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={() => void submit()}
    >
      <Field id="issue-body" label={t("areas.issue")}>
        <textarea
          id="issue-body"
          value={body}
          autoFocus
          placeholder={t("areas.issuePlaceholder")}
          onChange={(e) => setBody(e.target.value)}
          className="area-textarea"
          style={inputStyle}
        />
      </Field>
    </AreaDialog>
  );
}
