import React from "react";
import type { Focus } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { browseLibrary, type WorkoutLibrary } from "@sendtally/features/workouts";
import { DashedPanel } from "../components/DashedPanel";
import { LibraryCard } from "./LibraryCard";

export type LibraryBrowserProps = {
  library: WorkoutLibrary;
  /** The one focus it offers, where null is General; every focus by default. */
  focus?: Focus | null;
  /** What the search box says before anything is typed. */
  placeholder?: string;
  /** Shown in place of the list until a search is typed. */
  children?: React.ReactNode;
};

/** Search the library and list what it finds, the user's own first by last use. */
export function LibraryBrowser({
  library,
  focus,
  placeholder = t("workouts.search"),
  children,
}: LibraryBrowserProps): React.ReactElement {
  const [text, setText] = React.useState("");
  const browsing = children !== undefined && text.trim() === "";
  const found = browsing ? [] : browseLibrary(library.workouts, { text, focus }, library.usage);
  return (
    <div className="library-browser">
      <input
        type="search"
        className="library-search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        maxLength={80}
      />
      {browsing && children}
      {!browsing && found.length === 0 && (
        <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
      )}
      {found.length > 0 && (
        <div className="library-cards">
          {found.map((w) => (
            <LibraryCard key={w.id} workout={w} use={library.usage.get(w.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
