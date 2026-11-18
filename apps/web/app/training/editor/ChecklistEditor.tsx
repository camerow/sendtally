import React from "react";
import { MAX_CHECKLIST_LINE, MAX_CHECKLIST_LINES, type Item } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { useLineKeys, withLineAfter, withLineTyped } from "@sendtally/features/workouts";
import { Icon, type IconName } from "../../components/Icon";

export type ChecklistEditorProps = {
  item: Item;
  /** Applied to the item as it is when it runs, so a keystroke and an Enter in one beat both land. */
  onChange: (update: (item: Item) => Item) => void;
  onRemove: () => void;
  /** Absent for the first item. */
  onMoveUp?: () => void;
  /** Absent for the last item. */
  onMoveDown?: () => void;
};

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="icon-button" aria-label={label} onClick={onClick}>
      <Icon name={icon} size={18} strokeWidth={2} />
    </button>
  );
}

/** A checklist's lines typed in place: Enter adds the next line under the one typed. */
export function ChecklistEditor({
  item,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ChecklistEditorProps): React.ReactElement {
  const lines = item.checklist?.lines ?? [""];
  const { keys, insertAfter } = useLineKeys(lines.length);
  const [focusKey, setFocusKey] = React.useState<number | null>(null);
  const name = t("workouts.checklist");
  return (
    <div className="item-editor">
      <div className="item-editor-head">
        <span className="item-editor-name">{name}</span>
        {onMoveUp !== undefined && (
          <IconButton icon="up" label={t("workouts.moveUp", { name })} onClick={onMoveUp} />
        )}
        {onMoveDown !== undefined && (
          <IconButton icon="down" label={t("workouts.moveDown", { name })} onClick={onMoveDown} />
        )}
        <IconButton
          icon="remove"
          label={t("workouts.removeExercise", { name })}
          onClick={onRemove}
        />
      </div>
      {lines.map((line, i) => (
        <div key={keys[i]} className="checklist-line">
          <span className="checklist-line-n">{`${i + 1}.`}</span>
          <input
            className="form-input"
            value={line}
            maxLength={MAX_CHECKLIST_LINE}
            autoFocus={keys[i] === focusKey}
            aria-label={t("workouts.checklistLine", { n: i + 1 })}
            placeholder={i === lines.length - 1 ? t("workouts.checklistLineHint") : undefined}
            onChange={(e) => {
              const text = e.target.value;
              onChange((it) => withLineTyped(it, i, text));
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              if (lines.length >= MAX_CHECKLIST_LINES) return;
              onChange((it) => withLineAfter(it, i));
              setFocusKey(insertAfter(i));
            }}
          />
        </div>
      ))}
    </div>
  );
}
