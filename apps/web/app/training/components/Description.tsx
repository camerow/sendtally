import React from "react";
import {
  descriptionUnits,
  foldAt,
  linkText,
  type DescriptionLine,
  type DescriptionUnit,
} from "@sendtally/core/text";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

export type DescriptionProps = {
  text: string;
  /**
   * Folds past five lines behind More, as detail pages do; a sheet shows it whole. Folded past
   * as many lines as given, it fades out at the fold, as a running workout's does.
   */
  fold?: boolean | number;
  /** Opens unfolded, with Less to fold it. */
  startOpen?: boolean;
};

/** The line height every description is set in, which its lines are counted by. */
const LINE_PX = 22;

function Runs({ line }: { line: DescriptionLine }): React.ReactElement {
  return (
    <>
      {line.map((run, i) =>
        run.kind === "text" ? (
          run.text
        ) : (
          <a key={i} className="desc-link" href={run.url} target="_blank" rel="noopener noreferrer">
            {linkText(run.url)}
            <Icon name="arrowUpRight" size={13} strokeWidth={2.2} />
          </a>
        )
      )}
    </>
  );
}

type UnitProps = {
  unit: DescriptionUnit;
  /** The lines it keeps when it crosses the fold. */
  clamp: number | null;
  textRef: (el: HTMLElement | null) => void;
};

function Unit({ unit, clamp, textRef }: UnitProps): React.ReactElement {
  const style = clamp === null ? undefined : ({ WebkitLineClamp: clamp } as React.CSSProperties);
  const cut = clamp === null ? "" : " desc-clamp";
  if (unit.kind === "paragraph")
    return (
      <p ref={textRef} className={`desc-text${cut}`} style={style}>
        {unit.lines.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            <Runs line={line} />
          </React.Fragment>
        ))}
      </p>
    );
  const step = unit.kind === "step";
  return (
    <div className="desc-item">
      <span className={step ? "desc-step" : "desc-bullet"} aria-hidden="true">
        {step ? `${unit.n}.` : "•"}
      </span>
      <span ref={textRef} className={`desc-text${cut}`} style={style}>
        <Runs line={unit.line} />
      </span>
    </div>
  );
}

/**
 * A description as typed, with its paragraphs, bullets, numbered steps and links. Folded, it
 * shows whole paragraphs and items until five lines are used, clamping the one that crosses,
 * with More to open it in place. Lines are counted once, as first laid out.
 */
export function Description({
  text,
  fold: folds = false,
  startOpen = false,
}: DescriptionProps): React.ReactElement | null {
  const units = React.useMemo(() => descriptionUnits(text), [text]);
  const texts = React.useRef<(HTMLElement | null)[]>([]);
  const [lines, setLines] = React.useState<{ of: typeof units; counts: number[] } | null>(null);
  const [open, setOpen] = React.useState(startOpen);
  const fold = folds !== false;
  React.useLayoutEffect(() => {
    if (!fold) return;
    const counts = units.map((_, i) =>
      Math.round((texts.current[i]?.getBoundingClientRect().height ?? 0) / LINE_PX)
    );
    setLines({ of: units, counts });
  }, [fold, units]);
  if (units.length === 0) return null;
  const cut =
    fold && lines?.of === units
      ? foldAt(lines.counts, typeof folds === "number" ? folds : undefined)
      : null;
  const shut = cut !== null && !open;
  const shown = shut ? cut.units : units.length;
  return (
    <div className={shut && typeof folds === "number" ? "desc desc--fade" : "desc"}>
      {units.slice(0, shown).map((unit, i) => (
        <Unit
          key={i}
          unit={unit}
          clamp={shut && i === shown - 1 ? cut.lastLines : null}
          textRef={(el) => {
            texts.current[i] = el;
          }}
        />
      ))}
      {cut !== null && (
        <button
          type="button"
          className="desc-more"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? t("common.less") : t("common.more")}
        </button>
      )}
    </div>
  );
}
