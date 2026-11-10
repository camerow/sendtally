import React from "react";
import { PHOTOS, type PhotoKey } from "../media";

export type PhotoBackdropProps = {
  photo: PhotoKey;
  alt: string;
  position?: string;
  scrim: "left" | "right" | "even";
  priority?: boolean;
};

/** A full-bleed climbing photo behind a section, under a gunmetal scrim heaviest where the copy sits. */
export function PhotoBackdrop({
  photo,
  alt,
  position = "50% 50%",
  scrim,
  priority = false,
}: PhotoBackdropProps): React.ReactElement {
  return (
    <>
      <img
        className="l-backdrop"
        src={PHOTOS[photo]}
        alt={alt}
        style={{ objectPosition: position }}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      <div className={`l-scrim l-scrim--${scrim}`} />
    </>
  );
}
