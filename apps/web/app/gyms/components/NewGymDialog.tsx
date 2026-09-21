import React from "react";
import { emptyGymDraft, type Gym, type GymDraft, type GymsFeature } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { GymEditor } from "./GymEditor";

export type NewGymDialogProps = {
  gyms: GymsFeature;
  onClose: () => void;
  onCreated: (gym: Gym) => void;
};

/** The gym editor as a sheet over the log-session form, reusing the climb sheet's styles. */
export function NewGymDialog({ gyms, onClose, onCreated }: NewGymDialogProps): React.ReactElement {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const pressedBackdrop = React.useRef(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const el = dialog.current;
    if (el !== null && !el.open) el.showModal();
  }, []);

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
      .catch(() => {
        setError(t("gyms.saveFailed"));
        setSaving(false);
      });
  };

  return (
    <dialog
      ref={dialog}
      className="climb-sheet"
      aria-label={t("gyms.newGym")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="climb-sheet-panel" style={{ paddingTop: 18 }}>
        <GymEditor
          initial={emptyGymDraft()}
          saving={saving}
          error={error}
          onSave={onSave}
          onDelete={null}
          inDialog
        />
      </div>
    </dialog>
  );
}
