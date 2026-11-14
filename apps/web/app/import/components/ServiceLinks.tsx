import type React from "react";
import { exportPageUrl, IMPORT_SERVICES } from "@sendtally/core/import";
import { t } from "@sendtally/features/i18n";
import { monoMuted } from "../../settings/components/styles";

export function ServiceLinks(): React.ReactElement {
  return (
    <nav aria-labelledby="export-from" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span id="export-from" style={{ ...monoMuted, textTransform: "uppercase" }}>
        {t("import.exportFrom")}
      </span>
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {Object.entries(IMPORT_SERVICES).map(([format, name]) => (
          <li key={format}>
            <a
              href={exportPageUrl(format as keyof typeof IMPORT_SERVICES)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 600, color: "var(--bs-azure-ink)" }}
            >
              {name} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
