import { useQueryClient } from "@tanstack/react-query";
import type { LibraryChange, LibraryEdit, LibraryEntry, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";

export type LibraryEditing = {
  changes: QueryState<LibraryChange[]>;
  save: (edit: LibraryEdit) => Promise<void>;
  restore: (changeId: string) => Promise<void>;
};

/** A moderator's edits to one built-in, each refreshing the library and its changes. */
export function useLibraryEditing(api: SendtallyApi, entry: LibraryEntry): LibraryEditing {
  const client = useQueryClient();
  const { state: changes } = useQuery(queries.libraryChanges(api, entry.type, entry.id));
  const refresh = async (): Promise<void> => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queries.library(api).queryKey }),
      client.invalidateQueries({
        queryKey: queries.libraryChanges(api, entry.type, entry.id).queryKey,
      }),
    ]);
  };
  return {
    changes,
    save: async (edit) => {
      await api.saveLibraryEntry(entry.type, entry.id, edit);
      await refresh();
    },
    restore: async (changeId) => {
      await api.restoreLibraryChange(changeId);
      await refresh();
    },
  };
}
