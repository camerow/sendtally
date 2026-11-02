import AVFoundation

/// Plays the timer's cues from an engine that stays running while cues are ahead, which keeps
/// the app alive in the background (UIBackgroundModes audio) so the Live Activity moves on.
/// Mixes with the user's music and plays through the silent switch, as expo-audio is set to.
final class CueEngine {
  private let engine = AVAudioEngine()
  private let player = AVAudioPlayerNode()
  private var buffers: [String: AVAudioPCMBuffer] = [:]
  private var wanted = false
  private var stopping: DispatchWorkItem?

  init() {
    let bundle = Bundle(for: CueEngine.self)
      .url(forResource: "NativeTimerSounds", withExtension: "bundle")
      .flatMap(Bundle.init(url:))
    for name in ["tick", "work", "rest", "finish"] {
      guard let url = bundle?.url(forResource: name, withExtension: "wav"),
        let file = try? AVAudioFile(forReading: url),
        let buffer = AVAudioPCMBuffer(
          pcmFormat: file.processingFormat, frameCapacity: AVAudioFrameCount(file.length))
      else { continue }
      try? file.read(into: buffer)
      buffers[name] = buffer
    }
    engine.attach(player)
    engine.connect(player, to: engine.mainMixerNode, format: buffers["tick"]?.format)
    NotificationCenter.default.addObserver(
      self, selector: #selector(interrupted(_:)),
      name: AVAudioSession.interruptionNotification, object: nil)
  }

  func start() {
    stopping?.cancel()
    stopping = nil
    wanted = true
    guard !engine.isRunning else { return }
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
    try? session.setActive(true)
    do {
      try engine.start()
      player.play()
    } catch {
      NSLog("NativeTimer: audio engine did not start: \(error)")
    }
  }

  /// Stops once the last cue has had time to sound; the app may then be suspended.
  func stop() {
    guard wanted, stopping == nil else { return }
    let work = DispatchWorkItem { [weak self] in
      guard let self else { return }
      self.wanted = false
      self.stopping = nil
      self.player.stop()
      self.engine.stop()
    }
    stopping = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5, execute: work)
  }

  func play(_ sound: String) {
    guard engine.isRunning, let buffer = buffers[sound] else { return }
    player.scheduleBuffer(buffer, at: nil, options: .interrupts)
    if !player.isPlaying { player.play() }
  }

  @objc private func interrupted(_ note: Notification) {
    guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
      AVAudioSession.InterruptionType(rawValue: raw) == .ended
    else { return }
    guard wanted else { return }
    try? AVAudioSession.sharedInstance().setActive(true)
    try? engine.start()
    player.play()
  }
}
