export type EditorBarProps = {
  /** What is being edited, centred between Cancel and Save. */
  title: string;
  onSave: () => void;
  saveDisabled?: boolean;
  /** Save as a solid azure button, for an Edit mode on a detail page; an azure link otherwise. */
  solid?: boolean;
};
