import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery } from "../query";
import { sameTagName, type TagOption } from "./tags";

export type TagVocabulary = {
  all: TagOption[];
  suggestionsFor: (applied: string[]) => TagOption[];
};

export function useTagVocabulary(api: SendtallyApi): TagVocabulary {
  const { state } = useQuery(queries.tags(api));

  const all = React.useMemo(
    (): TagOption[] =>
      state.status === "ready"
        ? state.data.map((t) => ({ slug: t.slug, name: t.name, count: t.session_count }))
        : [],
    [state]
  );

  const suggestionsFor = React.useCallback(
    (applied: string[]): TagOption[] =>
      all.filter((option) => !applied.some((t) => sameTagName(t, option.name))),
    [all]
  );

  return { all, suggestionsFor };
}
