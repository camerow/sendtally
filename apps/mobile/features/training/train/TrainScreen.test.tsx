import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { TrainScreen } from "./TrainScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), setParams: jest.fn() } }));
jest.mock("../../billing/useBilling", () => ({
  useBilling: () => ({ membership: { access: false } }),
}));
jest.mock("../planning/useNewBlock", () => ({ useNewBlock: () => jest.fn() }));
jest.mock("../../../components/SegmentPager", () => ({ SegmentPager: () => null }));
jest.mock("../../../components/Sheet", () => {
  const { useEffect } = jest.requireActual<typeof React>("react");
  return {
    Sheet: function MockSheet({
      visible,
      onClose,
      children,
    }: {
      visible: boolean;
      onClose: () => void;
      children: React.ReactNode;
    }) {
      useEffect(() => {
        if (!visible) onClose();
      }, [visible, onClose]);
      return visible ? children : null;
    },
  };
});

describe("Train", () => {
  it("keeps Create past the trial, each of its rows locked and opening Membership", async () => {
    await render(
      <QueryClientProvider client={new QueryClient()}>
        <TrainScreen />
      </QueryClientProvider>
    );
    await fireEvent.press(screen.getByText("Create"));
    for (const row of ["Create block", "Create workout", "Create exercise"])
      expect(screen.getByLabelText(`${row}, members only`)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Create workout, members only"));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/membership",
      params: { source: "create" },
    });
  });
});
