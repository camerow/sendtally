import React from "react";
import type { LibraryPicture } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { useGoBack } from "../../lib/useGoBack";
import { Icon } from "../Icon";

export type DetailFrameProps = {
  /** Where Back goes when the page was opened directly, with no history to go back through. */
  backTo: string;
  backLabel?: string;
  /** Replaces going back, as an editor asking to discard its changes first. */
  onBack?: () => void;
  /** Right of Back, as the ··· menu. */
  action?: React.ReactNode;
  /** Sticky at the foot of the column, as Log session. */
  footer?: React.ReactNode;
  /** The full content width, for a page whose grids would scroll in the 720 column. */
  wide?: boolean;
  /** A built-in's pictures, paged sideways with dots; they stay still at the top while the page scrolls over them. */
  hero?: readonly LibraryPicture[];
  children?: React.ReactNode;
};

/** A detail page: Back and its actions over one centred 720 column (or the full width), with an optional sticky footer. */
export function DetailFrame({
  backTo,
  backLabel,
  onBack,
  action,
  footer,
  wide = false,
  hero = [],
  children,
}: DetailFrameProps): React.ReactElement {
  const back = useGoBack(backTo);
  const [page, setPage] = React.useState(0);
  const picture = hero[0];
  const credit = hero[page]?.credit ?? "";
  return (
    <div className={wide ? "detail detail--wide" : "detail"}>
      <div className="detail-bar">
        <button type="button" className="detail-back" onClick={onBack ?? back}>
          <span className="detail-back-chevron">
            <Icon name="chevron" size={14} strokeWidth={2.2} />
          </span>
          {backLabel ?? t("common.back")}
        </button>
        {action}
      </div>
      {picture !== undefined && (
        <div className={hero.length > 1 ? "detail-hero detail-hero--several" : "detail-hero"}>
          <div
            className="detail-hero-pager"
            role="region"
            aria-label={t("workouts.pictures")}
            tabIndex={hero.length > 1 ? 0 : undefined}
            onScroll={(e) =>
              setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
            }
          >
            {hero.map((p) => (
              <img key={p.url} src={p.url} alt={p.alt} />
            ))}
          </div>
          {credit !== "" && <span className="detail-hero-credit">{credit}</span>}
          {hero.length > 1 && (
            <span className="detail-hero-dots" aria-hidden>
              {hero.map((p, i) => (
                <span key={p.url} className={i === page ? "detail-hero-dot--on" : undefined} />
              ))}
            </span>
          )}
        </div>
      )}
      <div className={picture === undefined ? "detail-body" : "detail-body detail-body--hero"}>
        {children}
      </div>
      {footer !== undefined && <div className="detail-footer">{footer}</div>}
    </div>
  );
}
