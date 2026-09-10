import React from "react";
import { STORE_LINKS } from "../../lib/stores";
import { COPY } from "../copy";

export type AppStoresProps = {
  prominent?: boolean;
};

function Badge({ href, label }: { href: string; label: string }): React.ReactElement {
  if (href === "") return <span className="l-store-badge l-store-badge--soon">{label}</span>;
  return (
    <a className="l-store-badge" href={href}>
      {label}
    </a>
  );
}

export function AppStores({ prominent = false }: AppStoresProps): React.ReactElement {
  return (
    <div className={prominent ? "l-stores l-stores--hero" : "l-stores"}>
      {!prominent && <span className="l-stores-lead">{COPY.stores.lead}</span>}
      <Badge href={STORE_LINKS.android} label={COPY.stores.android} />
      <Badge href={STORE_LINKS.ios} label={COPY.stores.ios} />
    </div>
  );
}
