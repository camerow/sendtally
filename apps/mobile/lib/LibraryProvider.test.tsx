import { describe, expect, it } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { useHang } from "@sendtally/features/hang";
import { LibraryProvider } from "@sendtally/features/library";
import { hangData } from "../features/training/data/renderWithHang";

const offline = {
  library: () => Promise.reject(new Error("offline")),
} as unknown as SendtallyApi;

function Training(): React.ReactElement {
  const { state } = useHang(offline);
  return <Text>{`training ${state.status}`}</Text>;
}

describe("the built-in library", () => {
  it("never holds the app: logging works while it fails, and training shows its own retry", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["hang"], hangData());
    client.setQueryData(["workouts"], []);
    await render(
      <QueryClientProvider client={client}>
        <LibraryProvider api={offline}>
          <Text>Log a session</Text>
          <Training />
        </LibraryProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText("Log a session")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("training error")).toBeTruthy());
  });
});
