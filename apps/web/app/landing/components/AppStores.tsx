import React from "react";
import { STORE_LINKS } from "../../lib/stores";
import { COPY } from "../copy";

export type AppStoresProps = {
  prominent?: boolean;
};

type BadgeProps = {
  href: string;
  src: string;
  alt: string;
  pending: string;
};

function Badge({ href, src, alt, pending }: BadgeProps): React.ReactElement {
  const image = <img className="l-store-img" src={src} alt={alt} width={162} height={54} />;
  if (href === "")
    return (
      <span className="l-store l-store--pending">
        {image}
        <span className="l-store-note">{pending}</span>
      </span>
    );
  return (
    <a className="l-store" href={href}>
      {image}
    </a>
  );
}

export function AppStores({ prominent = false }: AppStoresProps): React.ReactElement {
  return (
    <div className={prominent ? "l-stores l-stores--hero" : "l-stores"}>
      {!prominent && <span className="l-stores-lead">{COPY.stores.lead}</span>}
      <Badge
        href={STORE_LINKS.android}
        src="/images/badges/google-play.png"
        alt={COPY.stores.android}
        pending={COPY.stores.pending}
      />
      <Badge
        href={STORE_LINKS.ios}
        src="/images/badges/app-store.svg"
        alt={COPY.stores.ios}
        pending={COPY.stores.pending}
      />
    </div>
  );
}
