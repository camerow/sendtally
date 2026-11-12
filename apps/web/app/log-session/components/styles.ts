import type React from "react";
import { monoLabel } from "../../components/styles";

export const columnHead: React.CSSProperties = {
  ...monoLabel,
  fontSize: 10,
  color: "rgba(64,63,76,0.55)",
};

export const stepperButton: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(64,63,76,0.18)",
  background: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--bs-gunmetal)",
};

export const PLUS = "M8 3.6V12.4M3.6 8H12.4";
export const MINUS = "M3.6 8H12.4";
export const CROSS = "M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8";
export const CHECK = "M3 8.4 6.2 11.6 12.6 4.8";
export const FLAG = "M4 14V2.8h7.6L9.4 6l2.2 3.2H4";
export const CHEVRON = "M6 4l4 4-4 4";
