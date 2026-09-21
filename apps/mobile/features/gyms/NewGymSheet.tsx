import React from "react";
import { emptyGymDraft, type Gym, type GymDraft, type GymsFeature } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { GymEditor } from "./GymEditor";

export type NewGymSheetProps = {
  visible: boolean;
  gyms: GymsFeature;
  onClose: () => void;
  onCreated: (gym: Gym) => void;
};

export function NewGymSheet({
  visible,
  gyms,
  onClose,
  onCreated,
}: NewGymSheetProps): React.ReactElement {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSave = (draft: GymDraft): void => {
    setSaving(true);
    setError(null);
    gyms
      .save(null, {
        name: draft.name,
        scale: draft.scale,
        circuits: draft.circuits,
        walls: draft.walls,
      })
      .then((gym) => {
        if (gym === null) throw new Error("no gym");
        onCreated(gym);
        onClose();
      })
      .catch(() => setError(t("gyms.saveFailed")))
      .finally(() => setSaving(false));
  };

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.close")}>
      <GymEditor
        initial={emptyGymDraft()}
        saving={saving}
        error={error}
        onSave={onSave}
        onDelete={null}
        inSheet
      />
    </Sheet>
  );
}
