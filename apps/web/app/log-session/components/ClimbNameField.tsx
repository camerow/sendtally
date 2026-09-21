import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import { areaClimbGradeLabel, climbOptions, type AreaClimb } from "@sendtally/features/areas";
import { climbDraftGrade } from "@sendtally/features/climbs";
import type { GradeScale } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { ComboField, type ComboItem } from "../../components/ComboField";
import { Glyph } from "./Glyph";
import { FLAG, columnHead, inputStyle } from "./styles";

export type ClimbNameFieldProps = {
  value: string;
  scale: GradeScale;
  suggestions: ClimbSummary[];
  inline?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  onChange: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
  /** Areas climbs matching the name; picking one links the row. */
  found?: AreaClimb[];
  linkedId?: string;
  onPickArea?: (climb: AreaClimb) => void;
  /** Offers adding the typed name to Areas as the last row. */
  onAdd?: () => void;
  onFocus?: () => void;
};

function MarkedName({ name, query }: { name: string; query: string }): React.ReactElement {
  const needle = query.trim();
  const at = needle === "" ? -1 : name.toUpperCase().indexOf(needle.toUpperCase());
  if (at < 0) return <span>{name}</span>;
  return (
    <span>
      {name.slice(0, at)}
      <span style={{ fontWeight: 600, color: "var(--bs-petal-ink)" }}>
        {name.slice(at, at + needle.length)}
      </span>
      {name.slice(at + needle.length)}
    </span>
  );
}

export function ClimbNameField({
  value,
  scale,
  suggestions,
  inline = false,
  autoFocus = false,
  placeholder = t("logSession.climbNamePlaceholder"),
  onChange,
  onPick,
  found = [],
  linkedId,
  onPickArea,
  onAdd,
  onFocus,
}: ClimbNameFieldProps): React.ReactElement {
  const browsing = value.trim() === "";
  const items: ComboItem[] = climbOptions(suggestions, found, linkedId).map((option) =>
    option.kind === "mine"
      ? {
          key: `mine-${option.climb.slug}`,
          label: (
            <>
              {option.climb.project && <Glyph d={FLAG} size={11} width={1.8} filled />}
              <MarkedName name={option.climb.name} query={value} />
            </>
          ),
          meta: climbDraftGrade(option.climb, scale),
          section: browsing ? t("common.recent") : undefined,
          onPick: () => onPick(option.climb),
        }
      : {
          key: `areas-${option.climb.id}`,
          label: (
            <>
              {option.project && <Glyph d={FLAG} size={11} width={1.8} filled />}
              <MarkedName name={option.climb.name} query={value} />
              <span style={{ ...columnHead, fontSize: 9, color: "var(--bs-azure-ink)" }}>
                {t("areas.inAreas")}
              </span>
            </>
          ),
          meta: areaClimbGradeLabel(option.climb),
          section: browsing ? t(option.logged ? "common.recent" : "areas.inAreas") : undefined,
          onPick: () => onPickArea?.(option.climb),
        }
  );
  if (onAdd !== undefined) {
    items.push({
      key: "add",
      label: t("areas.addToAreas", { name: value.trim() }),
      action: true,
      onPick: onAdd,
    });
  }

  return (
    <ComboField
      value={value}
      items={items}
      inline={inline}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className="log-session-control"
      inputStyle={inputStyle}
      trailing={
        linkedId === undefined ? undefined : (
          <span
            title={t("areas.linkedToAreas")}
            style={{ ...columnHead, fontSize: 9, color: "var(--bs-azure-ink)" }}
          >
            {t("areas.inAreas")}
          </span>
        )
      }
      onChange={onChange}
      onFocus={onFocus}
    />
  );
}
