import { router } from "expo-router";
import React from "react";
import { Text } from "react-native";
import type { Focus } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { focusLabel, focusMeaning } from "@sendtally/features/training";
import { Title } from "../components/Title";
import { LoadState } from "../data/LoadState";
import { ScreenFrame } from "../planning/ScreenFrame";
import { type } from "../type";
import { LibraryBrowser } from "./LibraryBrowser";
import { useLibrary } from "./useLibrary";

export type CategoryScreenProps = { focus: Focus | null };

/** All of one focus's workouts, the user's own first, in a column to search. */
export function CategoryScreen({ focus }: CategoryScreenProps): React.ReactElement {
  const { state, reload } = useLibrary();
  return (
    <ScreenFrame>
      <Title size={34}>{focusLabel(focus)}</Title>
      <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
        {focusMeaning(focus)}
      </Text>
      {state.status === "ready" ? (
        <LibraryBrowser
          library={state.data}
          focus={focus}
          placeholder={t("focus.search", { focus: focusLabel(focus) })}
          onPick={(w) => router.push({ pathname: "/workout/preview", params: { id: w.id } })}
        />
      ) : (
        <LoadState state={state} onRetry={() => void reload()} />
      )}
    </ScreenFrame>
  );
}
