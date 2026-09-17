import React from "react";
import type { SendtallyApi, TagSummary } from "@sendtally/api-client";
import { queries, useQuery } from "../query";
import { sameTagName, type TagOption } from "./tags";

export type TagVocabulary = {
  all: TagOption[];
  suggestionsFor: (applied: string[]) => TagOption[];
};

const NO_TAGS: TagOption[] = [];

const options = (tags: TagSummary[]): TagOption[] =>
  tags.map((t) => ({ slug: t.slug, name: t.name, count: t.session_count }));

export function useTagVocabulary(api: SendtallyApi): TagVocabulary {
  const { state } = useQuery({ ...queries.tags(api), select: options });
  const all = state.status === "ready" ? state.data : NO_TAGS;

  const suggestionsFor = React.useCallback(
    (applied: string[]): TagOption[] =>
      all.filter((option) => !applied.some((t) => sameTagName(t, option.name))),
    [all]
  );

  return { all, suggestionsFor };
}
