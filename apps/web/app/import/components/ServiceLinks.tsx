import type React from "react";
import { exportPageUrl, IMPORT_SERVICES } from "@sendtally/core/import";
import { linkAction } from "../../settings/components/styles";

export function ServiceLinks(): React.ReactElement {
  return (
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "6px 16px",
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
            style={linkAction}
          >
            {name}
          </a>
        </li>
      ))}
    </ul>
  );
}
