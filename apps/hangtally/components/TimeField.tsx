import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import React from "react";
import { Platform, Pressable, Text } from "react-native";
import { formatDate } from "@sendtally/features/i18n";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";

export type TimeFieldProps = { value: string; label: string; onChange: (value: string) => void };

const pad = (n: number): string => String(n).padStart(2, "0");

const toDate = (value: string): Date => {
  const [h, m] = value.split(":").map(Number);
  return new Date(1970, 0, 1, h ?? 8, m ?? 0);
};

/** "HH:MM" through the platform's own time picker. */
export function TimeField({ value, label, onChange }: TimeFieldProps): React.ReactElement {
  const c = useTheme();
  const date = toDate(value);
  const pick = (_: DateTimePickerChangeEvent, picked: Date): void =>
    onChange(`${pad(picked.getHours())}:${pad(picked.getMinutes())}`);

  if (Platform.OS === "ios")
    return (
      <DateTimePicker
        value={date}
        mode="time"
        display="compact"
        onValueChange={pick}
        accessibilityLabel={label}
        accentColor={c.ink}
      />
    );
  return (
    <Pressable
      onPress={() => DateTimePickerAndroid.open({ value: date, mode: "time", onValueChange: pick })}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 10,
        justifyContent: "center",
        backgroundColor: c.soft,
      }}
    >
      <Text style={[type.monoBold, { fontSize: 16, color: c.ink }]}>
        {formatDate(date, { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </Pressable>
  );
}
