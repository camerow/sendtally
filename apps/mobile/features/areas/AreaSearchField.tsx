import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { useAreaSearch, type AreaSummary } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { useApi } from "../../lib/api";
import { pressRow } from "../../lib/press";
import { actionText, fieldInput, resultList, resultMeta, resultName, resultRow } from "./styles";

export type PickedArea = { id: string; name: string };

export type AreaSearchFieldProps = {
  value: PickedArea | null;
  label: string;
  placeholder: string;
  /** Only places to climb: regions are left out. */
  crags?: boolean;
  /** Inside a sheet the input has to be the sheet's own, so it rides the keyboard. */
  inSheet?: boolean;
  addLabel?: (typed: string) => string;
  onPick: (area: AreaSummary | null) => void;
  onAdd?: (typed: string) => void;
  onFocus?: () => void;
};

/**
 * Search Areas by name; the results sit under the field while it is focused. Editing the text
 * drops the pick. There is no nearby search on mobile: it would need a location module.
 */
export function AreaSearchField({
  value,
  label,
  placeholder,
  crags = false,
  inSheet = false,
  addLabel,
  onPick,
  onAdd,
  onFocus,
}: AreaSearchFieldProps): React.ReactElement {
  const api = useApi();
  const [typed, setTyped] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState(false);
  const query = typed ?? value?.name ?? "";
  const picked = value !== null && (typed === null || typed === value.name);
  const found = useAreaSearch(api, picked ? "" : query, null, { crags, enabled: focused });
  const results = found.filter((a) => a.id !== value?.id);
  const adding = onAdd !== undefined && addLabel !== undefined && !picked && query.trim() !== "";
  const Input = inSheet ? BottomSheetTextInput : TextInput;

  return (
    <View style={{ gap: 7 }}>
      <Input
        accessibilityLabel={label}
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        returnKeyType="search"
        onChangeText={(next) => {
          setTyped(next);
          if (value !== null) onPick(null);
        }}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => setFocused(false)}
        style={{ ...fieldInput, ...(focused ? { borderColor: colors.azure } : {}) }}
      />
      {focused && (results.length > 0 || adding) && (
        <View style={resultList}>
          {results.map((area) => (
            <Pressable
              key={area.id}
              accessibilityRole="button"
              accessibilityLabel={area.name}
              onPress={() => {
                setTyped(null);
                Keyboard.dismiss();
                onPick(area);
              }}
              style={pressRow(resultRow)}
            >
              <Text numberOfLines={1} style={resultName}>
                {area.name}
              </Text>
              {(area.region_code !== null || area.status === "pending") && (
                <Text style={resultMeta}>
                  {area.region_code !== null ? t("areas.region") : t("areas.pending")}
                </Text>
              )}
            </Pressable>
          ))}
          {adding && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Keyboard.dismiss();
                onAdd(query.trim());
              }}
              style={pressRow(resultRow)}
            >
              <Text numberOfLines={2} style={actionText}>
                {`+ ${addLabel(query.trim())}`}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
