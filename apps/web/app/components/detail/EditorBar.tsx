import React from "react";
import { t } from "@sendtally/features/i18n";
import type { EditorBarProps } from "./types";

/** An editor's top, as iOS draws it: Cancel, what is being edited, and Save, kept in reach while the form scrolls. */
export function EditorBar({
  title,
  cancelLabel,
  onCancel,
  onSave,
  saveDisabled = false,
  solid = false,
}: EditorBarProps & { cancelLabel: string; onCancel: () => void }): React.ReactElement {
  const top = React.useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const el = top.current;
    if (el === null || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setScrolled(entry !== undefined && !entry.isIntersecting)
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={top} aria-hidden />
      <div className={scrolled ? "editor-bar editor-bar--scrolled" : "editor-bar"}>
        <button type="button" className="editor-bar-cancel" onClick={onCancel}>
          {cancelLabel}
        </button>
        <span className="editor-bar-title">{title}</span>
        <button
          type="button"
          className={solid ? "editor-bar-save editor-bar-save--solid" : "editor-bar-save"}
          disabled={saveDisabled}
          onClick={onSave}
        >
          {t("common.save")}
        </button>
      </div>
    </>
  );
}
