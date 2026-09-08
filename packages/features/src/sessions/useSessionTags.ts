import React from "react";
import type { SendtallyApi, SessionTag } from "@sendtally/api-client";
import { sameTagName, type TagOption } from "./tags";
import { useTagVocabulary } from "./useTagVocabulary";

export type SessionTagsEditor = {
  tags: string[];
  suggestions: TagOption[];
  saving: boolean;
  error: string | null;
  add: (name: string) => void;
  remove: (name: string) => void;
};

export function useSessionTags(
  api: SendtallyApi,
  fingerprint: string,
  initial: SessionTag[]
): SessionTagsEditor {
  const [tags, setTags] = React.useState<string[]>(() => initial.map((t) => t.name));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { reload: reloadVocabulary, suggestionsFor } = useTagVocabulary(api);

  const save = React.useCallback(
    async (next: string[], previous: string[]): Promise<void> => {
      setTags(next);
      setSaving(true);
      setError(null);
      try {
        const { tags: saved } = await api.setSessionTags(fingerprint, next);
        setTags(saved.map((t) => t.name));
        await reloadVocabulary();
      } catch {
        setTags(previous);
        setError("Could not save tags. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [api, fingerprint, reloadVocabulary]
  );

  const add = React.useCallback(
    (name: string): void => {
      const trimmed = name.trim();
      if (trimmed === "" || tags.some((t) => sameTagName(t, trimmed))) return;
      void save([...tags, trimmed], tags);
    },
    [save, tags]
  );

  const remove = React.useCallback(
    (name: string): void => {
      void save(
        tags.filter((t) => !sameTagName(t, name)),
        tags
      );
    },
    [save, tags]
  );

  return {
    tags,
    suggestions: suggestionsFor(tags),
    saving,
    error,
    add,
    remove,
  };
}
