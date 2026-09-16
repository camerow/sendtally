import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { formatDate, getLocale, t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";

export type DateTimeFieldProps = {
  mode: "date" | "time";
  /** `YYYY-MM-DD` for a date, `HH:MM` for a time - the draft's own formats. */
  value: string;
  label: string;
  onChange: (value: string) => void;
};

const pad = (n: number): string => String(n).padStart(2, "0");

function parse(mode: "date" | "time", value: string): Date {
  const now = new Date();
  const parts = value.split(mode === "date" ? "-" : ":").map(Number);
  if (parts.some(Number.isNaN)) return now;
  if (mode === "date") {
    const [y, m, d] = parts;
    return parts.length === 3 ? new Date(y!, m! - 1, d!) : now;
  }
  const [h, min] = parts;
  return parts.length === 2 ? new Date(1970, 0, 1, h, min) : now;
}

function serialize(mode: "date" | "time", d: Date): string {
  return mode === "date"
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Our field, the platform's picker: Android opens its dialog straight away, iOS shows the
 * inline calendar or the time wheels in a sheet, since its compact control cannot be styled.
 */
export function DateTimeField({
  mode,
  value,
  label,
  onChange,
}: DateTimeFieldProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const date = parse(mode, value);
  const text = formatDate(
    date,
    mode === "date"
      ? { year: "numeric", month: "numeric", day: "numeric" }
      : { hour: "2-digit", minute: "2-digit" }
  );

  function pick(_: DateTimePickerEvent, picked?: Date): void {
    if (picked !== undefined) onChange(serialize(mode, picked));
  }

  function openPicker(): void {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value: date, mode, onChange: pick });
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text }}
        style={press({
          minHeight: 46,
          justifyContent: "center",
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: "rgba(64,63,76,0.15)",
          borderRadius: radius.control,
          paddingHorizontal: 13,
        })}
      >
        <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.gunmetal }}>{text}</Text>
      </Pressable>
      {Platform.OS === "ios" && (
        <Sheet
          visible={open}
          onClose={() => setOpen(false)}
          closeLabel={t("common.closeOptions", { label })}
        >
          <View style={{ paddingHorizontal: 18, paddingTop: 4, gap: 12 }}>
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: colors.textSecondary,
              }}
            >
              {label}
            </Text>
            <DateTimePicker
              value={date}
              mode={mode}
              display={mode === "date" ? "inline" : "spinner"}
              onChange={pick}
              locale={getLocale()}
              themeVariant="light"
              accentColor={colors.azureInk}
              style={{ alignSelf: "center" }}
            />
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              style={press({
                minHeight: 50,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.control,
                backgroundColor: colors.azureInk,
              })}
            >
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
                {t("common.done")}
              </Text>
            </Pressable>
          </View>
        </Sheet>
      )}
    </>
  );
}
