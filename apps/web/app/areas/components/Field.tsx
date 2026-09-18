import React from "react";
import { t } from "@sendtally/features/i18n";

export function Field({
  id,
  label,
  optional = false,
  children,
}: {
  id?: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="project-dialog-field" style={{ minWidth: 0 }}>
      <label className="project-dialog-label" htmlFor={id}>
        {label}
        {optional && <span style={{ opacity: 0.6 }}> {t("common.optional")}</span>}
      </label>
      {children}
    </div>
  );
}
