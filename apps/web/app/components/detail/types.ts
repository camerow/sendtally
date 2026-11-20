export type EditorBarProps = {
  /** What is being edited, centred between Cancel and Save. */
  title: string;
  /** Left out where Save sits in the footer instead, as Add climb. */
  onSave?: () => void;
  saveDisabled?: boolean;
  /** Save as a solid azure button, for an Edit mode on a detail page; an azure link otherwise. */
  solid?: boolean;
  /** The title is the page's h1, on an editor whose body has no heading of its own. */
  heading?: boolean;
  /** Cancel throws away real work, such as a workout that was run, so it reads as destructive. */
  cancelDestructive?: boolean;
};
