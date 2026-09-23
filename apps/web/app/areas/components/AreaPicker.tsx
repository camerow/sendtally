import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import {
  areaPath,
  atCrumb,
  isInside,
  pickedArea,
  stepUp,
  useAreaSearch,
  type LatLon,
  type PickedArea,
} from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { ComboField, type ComboItem } from "../../components/ComboField";

export type AreaPickerProps = {
  api: SendtallyApi;
  value: PickedArea | null;
  near: LatLon | null;
  /** Only places to climb: regions are left out. */
  crags?: boolean;
  id?: string;
  placeholder: string;
  inputStyle: React.CSSProperties;
  className?: string;
  /** The add row for a name nothing matches, when nothing is picked yet. */
  addLabel?: (typed: string) => string;
  onPick: (area: PickedArea | null) => void;
  /** Adds the typed name inside the picked area, or anywhere when nothing is picked. */
  onAdd?: (typed: string, parent: PickedArea | null) => void;
  onFocus?: () => void;
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 26,
  padding: "0 9px",
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--line-on-light)",
  background: "var(--surface-soft)",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--bs-gunmetal)",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const separator = (
  <span aria-hidden style={{ color: "rgba(64,63,76,0.45)", fontSize: 13 }}>
    ›
  </span>
);

/**
 * Search Areas by name. A pick becomes a path of chips and the text clears, so typing narrows
 * inside it: what is inside comes first, the rest of Areas after. A chip steps back to that
 * level, and backspace in the empty field steps up one.
 */
export function AreaPicker({
  api,
  value,
  near,
  crags = false,
  id,
  placeholder,
  inputStyle,
  className,
  addLabel,
  onPick,
  onAdd,
  onFocus,
}: AreaPickerProps): React.ReactElement {
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const found = useAreaSearch(api, query, near, {
    crags,
    enabled: focused,
    within: value?.id ?? null,
  });
  const typed = query.trim();
  const exact = found.some((a) => a.name.toLowerCase() === typed.toLowerCase());

  function pick(area: PickedArea | null): void {
    setQuery("");
    onPick(area);
  }

  const items: ComboItem[] = found
    .filter((a) => a.id !== value?.id)
    .map((area) => {
      const hit = pickedArea(area);
      const inside = isInside(area, value);
      return {
        key: area.id,
        label: area.name,
        detail:
          areaPath(hit)
            .slice(0, -1)
            .map((c) => c.name)
            .join(" › ") || undefined,
        meta:
          area.region_code !== null
            ? t("areas.region")
            : area.status === "pending"
              ? t("areas.pending")
              : undefined,
        section:
          value !== null
            ? inside
              ? t("areas.insideArea", { name: value.name })
              : t("areas.elsewhere")
            : typed === ""
              ? t("areas.nearby")
              : undefined,
        onPick: () => pick(hit),
      };
    });
  if (onAdd !== undefined && typed !== "" && !exact) {
    const label =
      value !== null && value.region !== true
        ? t("areas.addInside", { name: typed, parent: value.name })
        : addLabel?.(typed);
    if (label !== undefined) {
      items.push({
        key: "add",
        label,
        action: true,
        onPick: () => onAdd(typed, value),
      });
    }
  }

  const path = value === null ? [] : areaPath(value);
  const chips =
    value === null ? undefined : (
      <>
        {path.map((crumb, i) => (
          <React.Fragment key={crumb.id}>
            {i > 0 && separator}
            <button
              type="button"
              aria-label={t("areas.backTo", { name: crumb.name })}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(atCrumb(value, i))}
              style={{
                ...chipStyle,
                ...(i === path.length - 1 ? { borderColor: "var(--line-on-light-strong)" } : {}),
              }}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
        {separator}
      </>
    );

  return (
    <ComboField
      id={id}
      value={query}
      items={items}
      placeholder={value === null ? placeholder : undefined}
      className={className}
      inputStyle={inputStyle}
      leading={chips}
      onEmptyBackspace={value === null ? undefined : () => pick(stepUp(value))}
      onChange={setQuery}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
    />
  );
}
