import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type { AreaSummary } from "@sendtally/features/areas";
import { AreaDialog } from "../../areas/components/AreaDialog";
import { AreaPicker } from "../../areas/components/AreaPicker";
import { Field } from "../../areas/components/Field";
import { inputStyle } from "../../areas/styles";

export type MoveDialogProps = {
  api: SendtallyApi;
  count: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (parent: AreaSummary) => void;
};

/** Re-parents pending creations before they are decided; they stay pending afterwards. */
export function MoveDialog({
  api,
  count,
  busy,
  error,
  onClose,
  onSubmit,
}: MoveDialogProps): React.ReactElement {
  const [parent, setParent] = React.useState<AreaSummary | null>(null);
  const [missing, setMissing] = React.useState(false);
  return (
    <AreaDialog
      label="Moderation"
      title={count === 1 ? "Move 1 item under…" : `Move ${count} items under…`}
      submitLabel={parent === null ? "Move" : `Move under ${parent.name}`}
      busy={busy}
      error={missing && parent === null ? "Pick the area these belong under." : error}
      onClose={onClose}
      onSubmit={() => (parent === null ? setMissing(true) : onSubmit(parent))}
    >
      <p className="mod-muted">
        An area moves with everything inside it, and stays pending until you approve it.
      </p>
      <Field id="moderation-move-parent" label="New parent area">
        <AreaPicker
          api={api}
          id="moderation-move-parent"
          value={parent}
          near={null}
          placeholder="Search areas"
          inputStyle={inputStyle}
          onPick={setParent}
        />
      </Field>
    </AreaDialog>
  );
}
