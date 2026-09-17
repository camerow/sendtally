import * as Updates from "expo-updates";
import { Image } from "react-native";
import { colors } from "@sendtally/design/tokens";
import splashMark from "../../assets/splash-mark.png";

const SPLASH_MARK_SIZE = 180;

/** Reloads into the downloaded update behind a screen that matches the launch splash. */
export function restartIntoUpdate(): Promise<void> {
  return Updates.reloadAsync({
    reloadScreenOptions: {
      backgroundColor: colors.gold,
      image: {
        url: Image.resolveAssetSource(splashMark).uri,
        width: SPLASH_MARK_SIZE,
        height: SPLASH_MARK_SIZE,
      },
      fade: true,
    },
  });
}
