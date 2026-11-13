import React from "react";

const SIZE = 280;
const STROKE = 14;
const RADIUS = 126;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const bigClass = (big: string): string =>
  big.length <= 2
    ? "timer-big"
    : big.length <= 4
      ? "timer-big timer-big--m"
      : "timer-big timer-big--s";

export type TimerRingProps = {
  color: string;
  labelColor: string;
  phaseKey: number;
  label: string;
  big: string;
  hint: string;
  ariaLabel: string;
  onPress: () => void;
};

/** The countdown ring, its sweep drawn from the frame's `--p`; the number fades in on each new phase. */
export function TimerRing({
  color,
  labelColor,
  phaseKey,
  label,
  big,
  hint,
  ariaLabel,
  onPress,
}: TimerRingProps): React.ReactElement {
  return (
    <button type="button" className="timer-ring" aria-label={ariaLabel} onClick={onPress}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--on-dark-track)"
          strokeWidth={STROKE}
        />
        <circle
          className="timer-ring-arc"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            stroke: color,
            strokeDashoffset: `calc(${CIRCUMFERENCE}px * (1 - var(--p)))`,
          }}
        />
      </svg>
      <span className="timer-ring-text">
        <span className="timer-ring-label" style={{ color: labelColor }}>
          {label}
        </span>
        <span key={phaseKey} className={bigClass(big)}>
          {big}
        </span>
        <span className="timer-label timer-ring-hint">{hint}</span>
      </span>
    </button>
  );
}
