import React from "react";
import { STORE_LINKS } from "../../lib/stores";
import { COPY } from "../copy";

function Badge({ href, label }: { href: string; label: string }): React.ReactElement {
  if (href === "") return <span className="l-store-badge l-store-badge--soon">{label}</span>;
  return (
    <a className="l-store-badge" href={href}>
      {label}
    </a>
  );
}

export function AppStores(): React.ReactElement {
  return (
    <div className="l-stores">
      <span className="l-stores-lead">{COPY.stores.lead}</span>
      <Badge href={STORE_LINKS.ios} label={COPY.stores.ios} />
      <Badge href={STORE_LINKS.android} label={COPY.stores.android} />
    </div>
  );
}
