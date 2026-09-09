import React from "react";
import { inViewClass, useInView } from "../useInView";

export type RevealProps = {
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export function Reveal({ delay = 0, className, style, children }: RevealProps): React.ReactElement {
  const [ref, state] = useInView<HTMLDivElement>();
  const classes = [inViewClass("l-reveal", state), className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}
