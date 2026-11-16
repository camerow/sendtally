import { useQueryClient } from "@tanstack/react-query";
import type {
  LibraryChange,
  LibraryEdit,
  LibraryEntry,
  LibraryMediaRow,
  MediaEdit,
  PictureUpload,
  SendtallyApi,
} from "@sendtally/api-client";
import { queries, useQuery, type QueryState } from "../query";

export type LibraryEditing = {
  item: QueryState<{ media: LibraryMediaRow[]; changes: LibraryChange[] }>;
  save: (edit: LibraryEdit) => Promise<void>;
  restore: (changeId: string) => Promise<void>;
  addPicture: (picture: PictureUpload, signal?: AbortSignal) => Promise<void>;
  editMedia: (id: string, edit: MediaEdit) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
};

/** A moderator's edits to one built-in, each refreshing the library and the item's pictures and changes. */
export function useLibraryEditing(api: SendtallyApi, entry: LibraryEntry): LibraryEditing {
  const client = useQueryClient();
  const itemQuery = queries.libraryItem(api, entry.type, entry.id);
  const { state: item } = useQuery(itemQuery);
  const then =
    <A extends unknown[]>(write: (...args: A) => Promise<unknown>) =>
    async (...args: A): Promise<void> => {
      await write(...args);
      await Promise.all([
        client.invalidateQueries({ queryKey: queries.library(api).queryKey }),
        client.invalidateQueries({ queryKey: itemQuery.queryKey }),
      ]);
    };
  return {
    item,
    save: then((edit: LibraryEdit) => api.saveLibraryEntry(entry.type, entry.id, edit)),
    restore: then((changeId: string) => api.restoreLibraryChange(changeId)),
    addPicture: then((picture: PictureUpload, signal?: AbortSignal) =>
      api.addLibraryPicture(entry.type, entry.id, picture, signal)
    ),
    editMedia: then((id: string, edit: MediaEdit) => api.editLibraryMedia(id, edit)),
    deleteMedia: then((id: string) => api.deleteLibraryMedia(id)),
  };
}
