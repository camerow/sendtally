import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { readFocus } from "@sendtally/features/training";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { CategoryScreen } from "../../features/training/library/CategoryScreen";

export default function WorkoutCategoryRoute(): React.ReactElement {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const known = readFocus(focus);
  if (known === undefined) return <Redirect href="/(tabs)/train" />;
  return (
    <HangDataProvider>
      <CategoryScreen focus={known} />
    </HangDataProvider>
  );
}
