import React from "react";
import type { LandingPhoto } from "../photos";

export type PhotoProps = {
  photo: LandingPhoto;
  className?: string;
  style?: React.CSSProperties;
  imgRef?: React.RefObject<HTMLImageElement | null>;
  priority?: boolean;
};

function useImageMissing(ref: React.RefObject<HTMLImageElement | null>): boolean {
  const [missing, setMissing] = React.useState(false);
  React.useEffect(() => {
    const img = ref.current;
    if (img === null) return;
    const settle = (): void => setMissing(img.naturalWidth === 0);
    if (img.complete) {
      settle();
      return;
    }
    img.addEventListener("load", settle);
    img.addEventListener("error", settle);
    return () => {
      img.removeEventListener("load", settle);
      img.removeEventListener("error", settle);
    };
  }, [ref]);
  return missing;
}

export function Photo({
  photo,
  className,
  style,
  imgRef,
  priority = false,
}: PhotoProps): React.ReactElement {
  const ownRef = React.useRef<HTMLImageElement>(null);
  const ref = imgRef ?? ownRef;
  const missing = useImageMissing(ref);
  return (
    <div className={["l-photo", className].filter(Boolean).join(" ")} style={style}>
      <img
        ref={ref}
        className="l-photo-img"
        src={photo.src}
        alt={photo.alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        hidden={missing}
      />
    </div>
  );
}
