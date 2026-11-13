export type Tone = "tick" | "work" | "rest";

let context: AudioContext | null = null;
const buffers = new Map<Tone, Promise<AudioBuffer>>();

const audio = (): AudioContext => (context ??= new AudioContext());

/** Wakes audio up inside a click or key press, since browsers keep it silent until one. */
export function unlockTones(): void {
  void audio().resume();
}

/** Plays one of the timer's tones, the same sounds as the phone's. */
export function playTone(tone: Tone): void {
  const ctx = audio();
  let buffer = buffers.get(tone);
  if (buffer === undefined) {
    buffer = fetch(`/sounds/${tone}.wav`)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b));
    buffers.set(tone, buffer);
  }
  buffer
    .then((b) => {
      const source = ctx.createBufferSource();
      source.buffer = b;
      source.connect(ctx.destination);
      source.start();
    })
    .catch(() => buffers.delete(tone));
}
