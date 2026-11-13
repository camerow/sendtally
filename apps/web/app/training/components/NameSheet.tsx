import React from "react";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";

export type NameSheetProps = {
  title: string;
  /** Prefilled and selected, so typing replaces it. */
  name: string;
  action: string;
  onSave: (name: string) => void;
  /** Closing it saves nothing. */
  onClose: () => void;
};

/** Names something on the way to making it: one field and one button. */
export function NameSheet({
  title,
  name: initial,
  action,
  onSave,
  onClose,
}: NameSheetProps): React.ReactElement {
  const [name, setName] = React.useState(initial);
  const save = (): void => {
    onSave(name.trim() || initial);
    onClose();
  };
  return (
    <Sheet open title={title} onClose={onClose} action={{ label: action, onPress: save }}>
      <form
        className="form-section"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <span className="train-label">{t("hang.name")}</span>
        <input
          className="name-field"
          aria-label={t("hang.name")}
          value={name}
          maxLength={80}
          data-autofocus
          onFocus={(e) => e.target.select()}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Sheet>
  );
}
