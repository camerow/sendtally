import React from "react";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";

/** Which gym the live session is at, or none. */
export function GymSheet({
  open,
  gyms,
  gymId,
  onPick,
  onClose,
}: {
  open: boolean;
  gyms: readonly Gym[];
  gymId: string | undefined;
  onPick: (gymId: string | undefined) => void;
  onClose: () => void;
}): React.ReactElement {
  const options = [
    ...gyms.map((g) => ({ id: g.id as string | undefined, name: g.name })),
    { id: undefined, name: t("gyms.noGym") },
  ];
  return (
    <Sheet open={open} title={t("gyms.gym")} onClose={onClose}>
      <div className="option-rows" role="radiogroup" aria-label={t("gyms.gym")}>
        {options.map((o) => (
          <button
            key={o.id ?? "none"}
            type="button"
            role="radio"
            aria-checked={o.id === gymId}
            className="option-row"
            onClick={() => onPick(o.id)}
          >
            {o.name}
            {o.id === gymId && <Icon name="check" size={18} strokeWidth={2.4} />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
