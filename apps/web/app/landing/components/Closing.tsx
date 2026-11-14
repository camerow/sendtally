import React from "react";
import { useLanding } from "../LandingContext";
import { AppStores } from "./AppStores";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { WebAccountLink } from "./WebAccountLink";

export type ClosingProps = {
  title: string;
  webAccount: string;
};

export function Closing({ title, webAccount }: ClosingProps): React.ReactElement {
  const { copy } = useLanding();
  return (
    <section id="start" className="l-closing">
      <PhotoBackdrop
        photo="sandstoneWall"
        alt={copy.hero.photoAlt}
        position="68% 45%"
        scrim="even"
      />
      <div className="l-closing-inner">
        <h2 className="l-closing-title">{title}</h2>
        <AppStores prominent />
        <WebAccountLink label={webAccount} tone="dark" />
      </div>
    </section>
  );
}
