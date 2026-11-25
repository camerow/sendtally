import React from "react";
import { Sheet } from "../../components/Sheet";
import type { DeleteFlow } from "./deleteFlows";

/** The confirm a ··· delete opens: closes, then deletes. */
export function DeleteSheet({
  flow,
  onClose,
  onDelete,
}: {
  flow: DeleteFlow;
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
