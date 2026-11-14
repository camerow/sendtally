import React from "react";
import { Link } from "react-router";
import type { WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { CategoryMark } from "./CategoryMark";

export type ShelfHeaderProps = {
  title: string;
  /** The category whose mark leads the title. */
  kind?: WorkoutKind;
  /** Opens the whole shelf; left out when the shelf already shows all of it. */
  seeAll?: { to: string; count: number };
  /** A round plus making a new one in the shelf. */
  add?: { label: string; onPress: () => void };
};

/** A shelf's heading: its mark, name and See all as one link. */
export function ShelfHeader({ title, kind, seeAll, add }: ShelfHeaderProps): React.ReactElement {
  const heading = (
    <>
      {kind !== undefined && <CategoryMark kind={kind} size={28} />}
      <span className="shelf-head-text">
        <h2 className="train-title shelf-title">{title}</h2>
        {seeAll !== undefined && (
          <span className="train-label shelf-see-all">
            {t("workouts.seeAllCount", { n: seeAll.count })}
            <Icon name="chevron" size={14} strokeWidth={2.2} />
          </span>
        )}
      </span>
    </>
  );
  const head =
    seeAll === undefined ? (
      <div className="shelf-head">{heading}</div>
    ) : (
      <Link
        to={seeAll.to}
        className="shelf-head shelf-head--link"
        aria-label={t("workouts.seeAllOf", { kind: title })}
      >
        {heading}
      </Link>
    );
  return (
    <div className="shelf-head-row">
      {head}
      {add !== undefined && (
        <button type="button" className="detail-add" aria-label={add.label} onClick={add.onPress}>
          <Icon name="plus" size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
