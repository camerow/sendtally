import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { confirmDestructive } from "../../lib/confirmDestructive";
import { liveRunStorage } from "../../lib/liveRunStorage";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { Button } from "../training/components/Button";
import { Label } from "../training/components/Label";
import { AMBER } from "../training/components/tints";
import { Title } from "../training/components/Title";
import { type } from "../training/type";
import { askingStore, type Asking } from "./startLive";

function Body({ asking }: { asking: Asking }): React.ReactElement {
  const { running, next, start } = asking;
  const name = { name: running.name };
  const discard = (): void =>
    confirmDestructive({
      title: running.climbing ? t("tally.discardTitle") : t("hang.discardRunTitle"),
      body: running.climbing ? t("tally.discardBody") : t("hang.discardRunBody"),
      action: t("hang.discard"),
      onConfirm: () => {
        askingStore.close();
        running.discard();
        start();
      },
    });
  return (
    <View style={{ gap: 12, paddingHorizontal: 18, paddingBottom: 8 }}>
      <Label color={AMBER}>{t("tally.alreadyRunning")}</Label>
      <Title size={26}>{t("tally.stillGoing", name)}</Title>
      <Text style={[type.body, { fontSize: 14.5, lineHeight: 21, color: colors.textSecondary }]}>
        {t("tally.oneAtATime", { next })}
      </Text>
      <Button
        label={t("tally.resumeName", name)}
        onPress={() => {
          askingStore.close();
          running.resume();
        }}
        variant="primary"
        height={50}
      />
      <Button
        label={t("tally.recordName", name)}
        onPress={() => askingStore.record(asking)}
        variant="outline"
        height={50}
      />
      <Button
        label={t("tally.discardName", name)}
        onPress={discard}
        variant="danger"
        height={50}
        style={{ borderWidth: 1.5, borderColor: "rgba(196,48,61,0.4)" }}
      />
      <Button label={t("common.cancel")} onPress={askingStore.close} variant="muted" height={44} />
    </View>
  );
}

/**
 * Asks what happens to the session or workout already running before another starts, and starts
 * the waiting one once a recorded run is saved or thrown away.
 */
export function AlreadyRunningSheet(): React.ReactElement {
  const asking = React.useSyncExternalStore(askingStore.subscribe, askingStore.read);
  const run = React.useSyncExternalStore(liveRunStorage.subscribe, liveRunStorage.read);
  const session = React.useSyncExternalStore(liveSessionStorage.subscribe, liveSessionStorage.read);
  const [shown, setShown] = React.useState(asking);
  if (asking !== null && asking !== shown) setShown(asking);
  React.useEffect(() => {
    if (run === null && session === null) askingStore.settled();
  }, [run, session]);
  return (
    <Sheet visible={asking !== null} onClose={askingStore.close} closeLabel={t("common.cancel")}>
      {shown !== null && <Body asking={shown} />}
    </Sheet>
  );
}
