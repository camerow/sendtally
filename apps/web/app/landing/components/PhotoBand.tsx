import React from "react";
import { Button, Label } from "@sendtally/design";
import { COPY } from "../copy";
import { LANDING_PHOTOS } from "../photos";
import { prefersReducedMotion } from "../useInView";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";

function useParallax(): [
  React.RefObject<HTMLDivElement | null>,
  React.RefObject<HTMLImageElement | null>,
] {
  const bandRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const band = bandRef.current;
    if (band === null || prefersReducedMotion()) return;
    let frame = 0;
    const update = (): void => {
      frame = 0;
      const img = imgRef.current;
      if (img === null) return;
      const r = band.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = `scale(1.12) translateY(${(progress * -6).toFixed(2)}%)`;
    };
    const onScroll = (): void => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return [bandRef, imgRef];
}

export function PhotoBand(): React.ReactElement {
  const [bandRef, imgRef] = useParallax();
  return (
    <div ref={bandRef} className="l-band">
      <Photo photo={LANDING_PHOTOS.band} className="l-band-photo" imgRef={imgRef} />
      <div className="l-band-shade" />
      <div className="l-band-copy">
        <Reveal>
          <Label on="dark" style={{ letterSpacing: "0.1em" }}>
            {COPY.band.eyebrow}
          </Label>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="l-band-title">{COPY.band.title}</h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="l-band-body">{COPY.band.body}</p>
        </Reveal>
        <Reveal delay={240}>
          <Button variant="gold" href="#insights">
            {COPY.band.cta}
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
