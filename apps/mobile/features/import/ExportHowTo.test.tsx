import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { ExportHowTo } from "./ExportHowTo";

jest.mock("../../lib/api", () => ({ useApi: () => ({}) }));

describe("ExportHowTo", () => {
  it("shows only the picked source's steps and its site", async () => {
    await render(<ExportHowTo source="mountainProject" />);
    expect(screen.getByText("Get your log out")).toBeTruthy();
    expect(screen.getByText("Select “Export CSV” to download the file.")).toBeTruthy();
    expect(screen.getByText("Open mountainproject.com")).toBeTruthy();
  });

  it("links a search for an app with no documented export", async () => {
    await render(<ExportHowTo source="kaya" />);
    expect(screen.getByText("Search for the Kaya export")).toBeTruthy();
  });

  it("for a spreadsheet, gives the steps, the prompt to share and the AI app route", async () => {
    await render(<ExportHowTo source="spreadsheet" />);
    expect(screen.getByText("Bring in your spreadsheet")).toBeTruthy();
    expect(screen.getByText("Share prompt")).toBeTruthy();
    expect(screen.getByText("Use your own AI app")).toBeTruthy();
  });

  it("puts a given heading on top, the steps' title under it", async () => {
    await render(<ExportHowTo source="8a" heading={<Text>Bring your whole log with you.</Text>} />);
    expect(screen.getByText("Bring your whole log with you.")).toBeTruthy();
    expect(screen.getByText("Get your log out")).toBeTruthy();
    expect(screen.queryByText("8a.nu")).toBeNull();
  });
});
