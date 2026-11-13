import React from "react";
import { bodyText, rowDivider } from "./styles";
import { Switch } from "../../components/Switch";

export type SwitchRowProps = {
  title: string;
  body: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
};

/** A ruled settings row: what it is, what it does, and its switch. */
export function SwitchRow({
  title,
  body,
  checked,
  disabled,
  onChange,
}: SwitchRowProps): React.ReactElement {
  return (
    <>
      <div style={rowDivider} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 44 }}>
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
          <p style={bodyText}>{body}</p>
        </span>
        <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
      </div>
    </>
  );
}
