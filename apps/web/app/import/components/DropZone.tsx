import React from "react";
import { t } from "@sendtally/features/i18n";
import { monoMuted } from "../../settings/components/styles";

export function DropZone({ onFile }: { onFile: (file: File) => void }): React.ReactElement {
  const [over, setOver] = React.useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file !== undefined) onFile(file);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "36px 18px",
        background: over ? "var(--surface-soft)" : "var(--bs-white)",
        border: "1px dashed var(--line-on-light-strong)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="m9 15 3-3 3 3" />
      </svg>
      <label htmlFor="import-file" style={{ fontWeight: 600, fontSize: 15 }}>
        {t("import.dropLabel")}
      </label>
      <input
        id="import-file"
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file !== undefined) onFile(file);
        }}
        style={{ fontSize: 12, color: "rgba(64,63,76,0.6)" }}
      />
      <span style={{ ...monoMuted, textAlign: "center", maxWidth: 480 }}>
        {t("import.dropHint")}
      </span>
    </div>
  );
}
