import { Camera, Map, Marker, type CameraRef } from "@maplibre/maplibre-react-native";
import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { MAP_STYLE_URL, mapView, sameSpot, type LatLon } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type LocationMapProps = {
  /** The coordinates the form holds; the map follows them when they change from outside. */
  value: LatLon | null;
  /** Where to open when there is no value yet, or nothing for the whole world. */
  near: LatLon | null;
  /** Areas already in Areas around the pin, drawn so a duplicate shows before saving. */
  around: Array<LatLon & { id: string; name: string }>;
  onMove: (at: LatLon) => void;
};

function Pin(): React.ReactElement {
  return (
    <Svg width={28} height={36} viewBox="0 0 28 36">
      <Path d="M14 35S3 21 3 13a11 11 0 0 1 22 0c0 8-11 22-11 22z" fill={colors.watermelonInk} />
      <Circle cx={14} cy={13} r={4.5} fill={colors.white} />
    </Svg>
  );
}

/**
 * A map with the pin fixed at its centre: dragging the map moves what is under the pin. Only a
 * drag reports a position, so opening the map never fills in coordinates nobody chose.
 */
export function LocationMap({ value, near, around, onMove }: LocationMapProps): React.ReactElement {
  const camera = React.useRef<CameraRef>(null);
  const [opening] = React.useState(() => mapView(value, near));
  const center = React.useRef<LatLon>(opening);

  React.useEffect(() => {
    if (value === null || sameSpot(center.current, value)) return;
    center.current = value;
    camera.current?.jumpTo({ center: [value.lon, value.lat], zoom: 13 });
  }, [value]);

  return (
    <View
      style={{
        height: 240,
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        overflow: "hidden",
      }}
    >
      <Map
        style={{ flex: 1 }}
        mapStyle={MAP_STYLE_URL}
        accessibilityLabel={t("areas.mapLabel")}
        touchRotate={false}
        touchPitch={false}
        compass={false}
        logo={false}
        onRegionDidChange={({ nativeEvent }) => {
          const [lon, lat] = nativeEvent.center;
          center.current = { lat, lon };
          if (nativeEvent.userInteraction) onMove({ lat, lon });
        }}
      >
        <Camera
          ref={camera}
          initialViewState={{ center: [opening.lon, opening.lat], zoom: opening.zoom }}
        />
        {around.map((a) => (
          <Marker key={a.id} id={a.id} lngLat={[a.lon, a.lat]} anchor="left">
            <View
              pointerEvents="none"
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <View
                style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textMuted }}
              />
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  letterSpacing: 0.4,
                  color: colors.gunmetal,
                }}
              >
                {a.name}
              </Text>
            </View>
          </Marker>
        ))}
      </Map>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ marginBottom: 36 }}>
          <Pin />
        </View>
      </View>
    </View>
  );
}
