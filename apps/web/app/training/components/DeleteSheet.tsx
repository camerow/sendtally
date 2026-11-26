import React from "react";
import { Sheet } from "../../components/Sheet";
import type { DeleteCopy } from "@sendtally/features/training";

/** The confirm a ··· delete opens: closes, then deletes. */
export function DeleteSheet({
  flow,
  onClose,
  onDelete,
}: {
  flow: DeleteCopy;
  onClose: () => void;
  onDelete: () => void;
}): React.ReactElement {
  return (
    <Sheet
      open
      title={flow.title}
      onClose={onClose}
      action={{
        label: flow.action,
        danger: true,
        onPress: () => {
          onClose();
          onDelete();
        },
      }}
    >
      <p className="sheet-body">{flow.body}</p>
    </Sheet>
  );
}
