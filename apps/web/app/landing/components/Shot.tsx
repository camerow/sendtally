import React from "react";
import { MEDIA } from "../media";
import type { MediaCopy } from "../copy";
import { prefersReducedMotion } from "../useInView";

export type ShotProps = {
  media: MediaCopy;
  className?: string;
  priority?: boolean;
};

/** One phone capture: a still, or a silent loop that holds its poster under reduced motion. */
export function Shot({ media, className, priority = false }: ShotProps): React.ReactElement {
  const item = MEDIA[media.key];
  const video = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    const el = video.current;
    if (el === null || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) el.play().catch(() => undefined);
      else el.pause();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={["l-shot", className].filter(Boolean).join(" ")}>
      {item.kind === "video" ? (
        <video
          ref={video}
          src={item.src}
          poster={item.poster}
          aria-label={media.alt}
          muted
          loop
          playsInline
          preload="none"
        />
      ) : (
        <img
          src={item.src}
          alt={media.alt}
          width={1206}
          height={2622}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}
