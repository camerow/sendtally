import React from "react";
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
  children?: React.ReactNode;
};

/** A detail page: Back and its actions over one centred 720 column, with an optional sticky footer. */
export function DetailFrame({
  backTo,
  backLabel,
  onBack,
  action,
  footer,
  children,
}: DetailFrameProps): React.ReactElement {
  const back = useGoBack(backTo);
  return (
    <div className="detail">
      <div className="detail-bar">
        <button type="button" className="detail-back" onClick={onBack ?? back}>
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
