import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import {
  areaPath,
  atCrumb,
  isInside,
  pickedArea,
  stepUp,
  useAreaSearch,
  type PickedArea,
} from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { useApi } from "../../lib/api";
import { press, pressRow } from "../../lib/press";
import {
  actionText,
  fieldLabel,
  resultList,
  resultMeta,
  resultName,
  resultPath,
  resultRow,
} from "./styles";

export type { PickedArea };

export type AreaSearchFieldProps = {
  value: PickedArea | null;
  label: string;
  placeholder: string;
  /** Only places to climb: regions are left out. */
  crags?: boolean;
  /** Inside a sheet the input has to be the sheet's own, so it rides the keyboard. */
  inSheet?: boolean;
  /** The add row for a name nothing matches, when nothing is picked yet. */
  addLabel?: (typed: string) => string;
  onPick: (area: PickedArea | null) => void;
  /** Adds the typed name inside the picked area, or anywhere when nothing is picked. */
  onAdd?: (typed: string, parent: PickedArea | null) => void;
  onFocus?: () => void;
};

const chip = {
  height: 28,
  paddingHorizontal: 10,
  borderRadius: radius.pill,
  borderWidth: 1,
  borderColor: colors.lineOnLight,
  backgroundColor: colors.surfaceSoft,
  justifyContent: "center",
} as const;

function Separator(): React.ReactElement {
  return <Text style={{ fontSize: 13, color: colors.textFaint }}>›</Text>;
}

/**
 * Search Areas by name. A pick becomes a path of chips and the text clears, so typing narrows
 * inside it: what is inside comes first, the rest of Areas after. A chip steps back to that
 * level, and backspace in the empty field steps up one. There is no nearby search on mobile.
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
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [shownFor, setShownFor] = React.useState(value);
  if (value !== shownFor) {
    setShownFor(value);
    setQuery("");
  }
  const found = useAreaSearch(api, query, null, {
    crags,
    enabled: focused,
    within: value?.id ?? null,
  });
  const typed = query.trim();
  const results = found.filter((a) => a.id !== value?.id);
  const exact = found.some((a) => a.name.toLowerCase() === typed.toLowerCase());
  const insideLabel =
    value !== null && value.region !== true
      ? t("areas.addInside", { name: typed, parent: value.name })
      : addLabel?.(typed);
  const adding = onAdd !== undefined && typed !== "" && !exact && insideLabel !== undefined;
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  const path = value === null ? [] : areaPath(value);

  function pick(area: PickedArea | null): void {
    setQuery("");
    onPick(area);
  }

  return (
    <View style={{ gap: 7 }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          minHeight: 46,
          paddingVertical: path.length === 0 ? 0 : 7,
          paddingLeft: path.length === 0 ? 0 : 8,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: focused ? colors.azure : "rgba(64,63,76,0.15)",
          borderRadius: radius.control,
        }}
      >
        {value !== null &&
          path.map((crumb, i) => (
            <React.Fragment key={crumb.id}>
              {i > 0 && <Separator />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("areas.backTo", { name: crumb.name })}
                hitSlop={4}
                onPress={() => pick(atCrumb(value, i))}
                style={press({
                  ...chip,
                  ...(i === path.length - 1 ? { borderColor: colors.lineOnLightStrong } : {}),
                })}
              >
                <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.gunmetal }}>
                  {crumb.name}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        {path.length > 0 && <Separator />}
        <Input
          accessibilityLabel={label}
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          value={query}
          placeholder={value === null ? placeholder : ""}
          placeholderTextColor={colors.textFaint}
          returnKeyType="search"
          onChangeText={setQuery}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === "Backspace" && query === "" && value !== null) {
              pick(stepUp(value));
            }
          }}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => setFocused(false)}
          style={{
            flexGrow: 1,
            flexBasis: 80,
            minWidth: 80,
            minHeight: path.length === 0 ? 44 : 30,
            paddingHorizontal: path.length === 0 ? 13 : 2,
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        />
      </View>
      {focused && (results.length > 0 || adding) && (
        <View style={resultList}>
          {results.map((area, i) => {
            const hit = pickedArea(area);
            const section =
              value === null
                ? null
                : isInside(area, value)
                  ? t("areas.insideArea", { name: value.name })
                  : t("areas.elsewhere");
            const previous = results[i - 1];
            const heading =
              section !== null &&
              (previous === undefined || isInside(previous, value) !== isInside(area, value));
            const where = areaPath(hit)
              .slice(0, -1)
              .map((c) => c.name)
              .join(" › ");
            return (
              <React.Fragment key={area.id}>
                {heading && <Text style={{ ...fieldLabel, padding: 6 }}>{section}</Text>}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={where === "" ? area.name : `${area.name}, ${where}`}
                  onPress={() => {
                    Keyboard.dismiss();
                    pick(hit);
                  }}
                  style={pressRow(resultRow)}
                >
                  <View style={{ flexShrink: 1, gap: 2, paddingVertical: 6 }}>
                    <Text numberOfLines={1} style={resultName}>
                      {area.name}
                    </Text>
                    {where !== "" && (
                      <Text numberOfLines={1} style={resultPath}>
                        {where}
                      </Text>
                    )}
                  </View>
                  {(area.region_code !== null || area.status === "pending") && (
                    <Text style={resultMeta}>
                      {area.region_code !== null ? t("areas.region") : t("areas.pending")}
                    </Text>
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
          {adding && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Keyboard.dismiss();
                onAdd(typed, value);
              }}
              style={pressRow({
                ...resultRow,
                ...(results.length > 0
                  ? { borderTopWidth: 1, borderTopColor: colors.lineOnLightSoft }
                  : {}),
              })}
            >
              <Text numberOfLines={2} style={actionText}>
                {`+ ${insideLabel}`}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
