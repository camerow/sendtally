import React from "react";
import { useNavigate } from "react-router";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../Icon";

export type DetailFrameProps = {
  /** Where Back goes when the page was opened directly, with no history to go back through. */
  backTo: string;
  backLabel?: string;
  /** Right of Back, as the ··· menu. */
  action?: React.ReactNode;
  /** Sticky at the foot of the column, as Log session. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

/** A detail page: Back and its actions over one centred 720 column, with an optional sticky footer. */
export function DetailFrame({
  backTo,
  backLabel,
  action,
  footer,
  children,
}: DetailFrameProps): React.ReactElement {
  const navigate = useNavigate();
  const back = (): void => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    void (idx > 0 ? navigate(-1) : navigate(backTo));
  };
  return (
    <div className="detail">
      <div className="detail-bar">
        <button type="button" className="detail-back" onClick={back}>
          <span className="detail-back-chevron">
            <Icon name="chevron" size={14} strokeWidth={2.2} />
          </span>
          {backLabel ?? t("common.back")}
        </button>
        {action}
      </div>
      <div className="detail-body">{children}</div>
      {footer !== undefined && <div className="detail-footer">{footer}</div>}
    </div>
  );
}
