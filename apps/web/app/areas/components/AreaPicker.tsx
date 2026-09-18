import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useAreaSearch, type AreaSummary, type LatLon } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { ComboField, type ComboItem } from "../../components/ComboField";

export type PickedArea = { id: string; name: string };

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
  addLabel?: (typed: string) => string;
  onPick: (area: AreaSummary | null) => void;
  onAdd?: (typed: string) => void;
  onFocus?: () => void;
};

/** Search Areas by name, or nearby before anything is typed. Editing the text drops the pick. */
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
  const [typed, setTyped] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState(false);
  const query = typed ?? value?.name ?? "";
  const picked = value !== null && (typed === null || typed === value.name);
  const found = useAreaSearch(api, picked ? "" : query, near, { crags, enabled: focused });
  const results = found.filter((a) => a.id !== value?.id);

  const items: ComboItem[] = results.map((area) => ({
    key: area.id,
    label: area.name,
    meta:
      area.region_code !== null
        ? t("areas.region")
        : area.status === "pending"
          ? t("areas.pending")
          : undefined,
    section: query.trim() === "" || picked ? t("areas.nearby") : undefined,
    onPick: () => {
      setTyped(null);
      onPick(area);
    },
  }));
  if (onAdd !== undefined && addLabel !== undefined && !picked && query.trim() !== "") {
    items.push({
      key: "add",
      label: addLabel(query.trim()),
      action: true,
      onPick: () => onAdd(query.trim()),
    });
  }

  return (
    <ComboField
      id={id}
      value={query}
      items={items}
      placeholder={placeholder}
      className={className}
      inputStyle={inputStyle}
      onChange={(next) => {
        setTyped(next);
        if (value !== null) onPick(null);
      }}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
    />
  );
}
