import React from "react";
import { Icon } from "./Icon";
import { MoreMenu, type MoreMenuItem, type TriggerProps } from "./MoreMenu";

export type PageActionProps = {
  label: string;
} & (
  | { onPress: () => void; items?: undefined }
  | { items: readonly MoreMenuItem[]; onPress?: undefined }
);

function Button({ label, ...rest }: { label: string } & Partial<TriggerProps>): React.ReactElement {
  return (
    <button type="button" className="page-action" {...rest}>
      <span className="page-action-plus">
        <Icon name="plus" size={18} strokeWidth={2.6} />
      </span>
      {label}
    </button>
  );
}

/**
 * A page's one button, such as Create or Schedule: gunmetal with the gold plus at the right of
 * the title row on desktop, floating bottom right at 375. With items it opens MoreMenu's menu,
 * a dropdown on desktop and a bottom sheet at 375. Link components/page-action.css.
 */
export function PageAction({ label, items, onPress }: PageActionProps): React.ReactElement {
  if (items === undefined)
    return (
      <div className="page-action-wrap">
        <Button label={label} onClick={onPress} />
      </div>
    );
  return (
    <MoreMenu
      label={label}
      items={items}
      className="page-action-wrap"
      trigger={(button) => <Button label={label} {...button} />}
    />
  );
}
