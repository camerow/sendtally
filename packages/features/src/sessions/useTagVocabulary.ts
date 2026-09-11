import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { sameTagName, type TagOption } from "./tags";

export type TagVocabulary = {
  all: TagOption[];
  reload: () => Promise<void>;
  suggestionsFor: (applied: string[]) => TagOption[];
};

export function useTagVocabulary(api: SendtallyApi): TagVocabulary {
  const [all, setAll] = React.useState<TagOption[]>([]);

  const reload = React.useCallback(async (): Promise<void> => {
    try {
      const { tags } = await api.tags();
      setAll(tags.map((t) => ({ slug: t.slug, name: t.name, count: t.session_count })));
    } catch {
      setAll([]);
    }
  }, [api]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload only sets state after its await
    void reload();
  }, [reload]);

  const suggestionsFor = React.useCallback(
    (applied: string[]): TagOption[] =>
      all.filter((option) => !applied.some((t) => sameTagName(t, option.name))),
    [all]
  );

  return { all, reload, suggestionsFor };
}
