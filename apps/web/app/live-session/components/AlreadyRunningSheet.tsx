import React from "react";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { useLiveSessionStorage } from "../../lib/useLiveSessionStorage";
import { askingStore, type Asking } from "../startLive";

/**
 * Asks what happens to the session already running before another starts, and starts the
 * waiting one once a recorded session is saved or thrown away.
 */
export function AlreadyRunningSheet(): React.ReactElement | null {
  const asking = React.useSyncExternalStore(askingStore.subscribe, askingStore.read, () => null);
  const storage = useLiveSessionStorage();
  const session = React.useSyncExternalStore(storage.subscribe, storage.read, () => null);
  const [confirming, setConfirming] = React.useState<Asking | null>(null);
  React.useEffect(() => {
    if (session === null) askingStore.settled();
  }, [session]);

  if (confirming !== null) {
    return (
      <Sheet
        open
        title={t("tally.discardTitle")}
        onClose={() => setConfirming(null)}
        action={{
          label: t("hang.discard"),
          danger: true,
          onPress: () => {
            setConfirming(null);
            askingStore.close();
            confirming.running.discard();
            confirming.start();
          },
        }}
      >
        <p className="sheet-body">{t("tally.discardBody")}</p>
      </Sheet>
    );
  }
  if (asking === null) return null;
  return (
    <Sheet
      open
      kicker={t("tally.alreadyRunning")}
      kickerTone="amber"
      title={t("tally.stillGoing", { name: asking.running.name })}
      onClose={askingStore.close}
    >
      <div className="already-running-actions">
        <button
          type="button"
          className="sheet-action"
          onClick={() => {
            askingStore.close();
            asking.running.resume();
          }}
        >
          {t("hang.resume")}
        </button>
        <button type="button" className="sheet-cancel" onClick={() => askingStore.record(asking)}>
          {t("tally.record")}
        </button>
        <button type="button" className="danger-outline" onClick={() => setConfirming(asking)}>
          {t("hang.discard")}
        </button>
      </div>
    </Sheet>
  );
}
