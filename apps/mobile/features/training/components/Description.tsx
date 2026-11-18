import React from "react";
import { Linking, Pressable, Text, View, type TextLayoutEvent } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  descriptionUnits,
  FOLD_LINES,
  foldAt,
  linkText,
  type DescriptionLine,
  type DescriptionUnit,
} from "@sendtally/core/text";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { type } from "../type";

export type DescriptionProps = {
  text: string;
  /**
   * Folds past five lines behind More, as detail screens do; a sheet shows it whole. Folded
   * past as many lines as given, it fades out at the fold, as a running workout's does.
   */
  fold?: boolean | number;
  /** Opens unfolded, with Less to fold it. */
  startOpen?: boolean;
};

const BODY = [type.body, { fontSize: 15, lineHeight: 22, color: colors.textSecondary }];

function Runs({ line }: { line: DescriptionLine }): React.ReactElement {
  return (
    <>
      {line.map((run, i) =>
        run.kind === "text" ? (
          run.text
        ) : (
          <Text
            key={i}
            accessibilityRole="link"
            onPress={() => void Linking.openURL(run.url).catch(() => undefined)}
            style={{ color: colors.azure, textDecorationLine: "underline" }}
          >
            {linkText(run.url)}
            <View>
              <Icon name="arrowUpRight" size={13} color={colors.azure} strokeWidth={2.2} />
            </View>
          </Text>
        )
      )}
    </>
  );
}

type UnitProps = {
  unit: DescriptionUnit;
  numberOfLines?: number;
  onTextLayout?: (e: TextLayoutEvent) => void;
};

function Unit({ unit, numberOfLines, onTextLayout }: UnitProps): React.ReactElement {
  const cut = numberOfLines === undefined ? {} : { numberOfLines, ellipsizeMode: "tail" as const };
  if (unit.kind === "paragraph")
    return (
      <Text style={BODY} onTextLayout={onTextLayout} {...cut}>
        {unit.lines.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && "\n"}
            <Runs line={line} />
          </React.Fragment>
        ))}
      </Text>
    );
  const step = unit.kind === "step";
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text
        style={[
          step ? type.mono : type.body,
          {
            width: 18,
            fontSize: step ? 13 : 15,
            lineHeight: 22,
            color: colors.gunmetal,
          },
        ]}
      >
        {step ? `${unit.n}.` : "•"}
      </Text>
      <Text style={[BODY, { flex: 1 }]} onTextLayout={onTextLayout} {...cut}>
        <Runs line={unit.line} />
      </Text>
    </View>
  );
}

/** The foot of a folded description fading into the page, so it reads as more below. */
function Fade(): React.ReactElement {
  return (
    <View pointerEvents="none" style={{ marginTop: -38, height: 30 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.white} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.white} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#fade)" />
      </Svg>
    </View>
  );
}

/**
 * A description as typed, with its paragraphs, bullets, numbered steps and links. Folded, it
 * shows whole paragraphs and items until five lines are used, cutting the one that crosses,
 * with More to open it in place; it measures from a hidden copy laid out at the same width.
 */
export function Description({
  text,
  fold: folds = false,
  startOpen = false,
}: DescriptionProps): React.ReactElement | null {
  const units = React.useMemo(() => descriptionUnits(text), [text]);
  const [lines, setLines] = React.useState<readonly (number | undefined)[]>([]);
  const [open, setOpen] = React.useState(startOpen);
  const fold = folds !== false;
  const max = folds === true ? FOLD_LINES : folds || FOLD_LINES;
  if (units.length === 0) return null;
  const counts = units.map((_, i) => lines[i]);
  const measured = counts.every((n) => n !== undefined);
  const cut =
    fold && measured
      ? foldAt(
          counts.map((n) => n ?? 0),
          max
        )
      : null;
  const shut = fold && !open && (cut !== null || !measured);
  const shown = !shut ? units.length : (cut?.units ?? 1);
  const lastLines = !shut ? undefined : measured ? (cut?.lastLines ?? undefined) : max;
  const measure = (i: number) => (e: TextLayoutEvent) => {
    const n = e.nativeEvent.lines.length;
    setLines((was) => (was[i] === n ? was : Object.assign([...was], { [i]: n })));
  };
  return (
    <View style={{ gap: 8 }}>
      {fold && (
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, opacity: 0, gap: 8 }}
        >
          {units.map((unit, i) => (
            <Unit key={i} unit={unit} onTextLayout={measure(i)} />
          ))}
        </View>
      )}
      {units.slice(0, shown).map((unit, i) => (
        <Unit
          key={i}
          unit={unit}
          {...(i === shown - 1 && lastLines !== undefined && { numberOfLines: lastLines })}
        />
      ))}
      {shut && typeof folds === "number" && <Fade />}
      {fold && cut !== null && (
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          hitSlop={8}
          style={press({ height: 32, justifyContent: "center", alignSelf: "flex-start" })}
        >
          <Text style={[type.bodyBold, { fontSize: 14, color: colors.azure }]}>
            {open ? t("common.less") : t("common.more")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
