import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { setLocale } from "@sendtally/features/i18n";
import { RungEditor } from "./RungEditor";

const wallTime = { exercise: "Circuit", dose: { sets: 1, onS: 1200, offS: 60 } };

async function renderWeek(onChange: (change: object) => void): Promise<void> {
  await render(
    <RungEditor
      kind="climbing"
      item={wallTime}
      change={{ onS: 1200 }}
      unit="kg"
      onChange={onChange}
    />
  );
}

afterEach(() => setLocale("en"));

describe("RungEditor", () => {
  it.each(["en", "de"] as const)(
    "keeps a 20 minute wall time when its field is tapped in and out (%s)",
    async (locale) => {
      setLocale(locale);
      const onChange = jest.fn();
      await renderWeek(onChange);
      const field = screen.getByLabelText(locale === "en" ? "Work" : "Belastung");
      await fireEvent(field, "focus");
      await fireEvent(field, "blur");
      expect(onChange).not.toHaveBeenCalled();
    }
  );
});
