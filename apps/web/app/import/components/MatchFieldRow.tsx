import React from "react";
import { t } from "@sendtally/features/i18n";
import type { MatchRow } from "@sendtally/features/import";
import { monoLabel } from "../../components/styles";
import { select } from "../styles";

const NONE = "";

/** One of our fields as a choice of the sheet's columns, with a sample of what it holds. */
export function MatchFieldRow({
  row,
  columns,
  onPick,
  children,
}: {
  row: MatchRow;
  columns: string[];
  onPick: (column: string | null) => void;
  children?: React.ReactNode;
}): React.ReactElement {
  const id = React.useId();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "10px 0",
        borderBottom: "1px solid var(--line-on-light-soft)",
      }}
    >
      <label htmlFor={id} style={{ ...monoLabel, fontSize: 10 }}>
        {row.label}
      </label>
      <select
        id={id}
        style={{
          ...select,
          width: "100%",
          minHeight: 44,
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          color: row.column === null ? "rgba(64,63,76,0.55)" : "var(--bs-gunmetal)",
        }}
        value={row.column ?? NONE}
        onChange={(e) => onPick(e.target.value === NONE ? null : e.target.value)}
      >
        {(!row.required || row.column === null) && (
          <option value={NONE}>{t("import.match.noneOption")}</option>
        )}
        {columns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {row.sample !== "" && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-on-white-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.sample}
        </span>
      )}
      {children}
    </div>
  );
}
