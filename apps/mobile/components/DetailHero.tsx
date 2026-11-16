import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { LibraryPicture } from "@sendtally/core/hang";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

export type DetailHeroProps = {
  pictures: readonly LibraryPicture[];
  width: number;
  height: number;
  /** What covers the frame's bottom edge, so the credit and dots sit above it. */
  overlap?: number;
  /** A shade at the top, where the status bar sits on the picture. */
  shade?: boolean;
};

const label = {
  fontFamily: fonts.mono,
  fontSize: 10.5,
  color: colors.white,
  backgroundColor: "rgba(20,19,26,0.55)",
  paddingHorizontal: 7,
  paddingVertical: 3,
  borderRadius: 5,
  overflow: "hidden",
} as const;

function Picture({
  picture,
  width,
  height,
}: {
  picture: LibraryPicture;
  width: number;
  height: number;
}): React.ReactElement {
  const [failed, setFailed] = React.useState(false);
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: colors.surfaceSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {failed ? (
        <Text style={{ paddingHorizontal: 32, textAlign: "center", color: colors.textSecondary }}>
          {picture.alt}
        </Text>
      ) : (
        <Image
          source={{ uri: picture.url }}
          accessibilityLabel={picture.alt}
          accessibilityIgnoresInvertColors
          onError={() => setFailed(true)}
          resizeMode="cover"
          style={{ position: "absolute", width, height }}
        />
      )}
    </View>
  );
}

/** A built-in's pictures across the top of a detail screen or sheet: several swipe, with dots. */
export function DetailHero({
  pictures,
  width,
  height,
  overlap = 0,
  shade = false,
}: DetailHeroProps): React.ReactElement {
  const [page, setPage] = React.useState(0);
  const credit = pictures[page]?.credit ?? "";
  return (
    <View style={{ width, height, backgroundColor: colors.surfaceSoft }}>
      <ScrollView
        accessibilityLabel={t("workouts.pictures")}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={pictures.length > 1}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {pictures.map((p) => (
          <Picture key={p.url} picture={p} width={width} height={height} />
        ))}
      </ScrollView>
      {shade && (
        <Svg
          width={width}
          height={110}
          style={{ position: "absolute", top: 0 }}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#14131A" stopOpacity={0.35} />
              <Stop offset="1" stopColor="#14131A" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={110} fill="url(#shade)" />
        </Svg>
      )}
      {credit !== "" && (
        <Text
          style={[
            label,
            {
              position: "absolute",
              left: 14,
              maxWidth: width - 28,
              bottom: overlap + (pictures.length > 1 ? 30 : 12),
            },
          ]}
        >
          {credit}
        </Text>
      )}
      {pictures.length > 1 && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: overlap + 16,
            alignSelf: "center",
            flexDirection: "row",
            gap: 6,
          }}
        >
          {pictures.map((p, i) => (
            <View
              key={p.url}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? colors.white : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
