import ActivityKit
import Foundation

/// Owns the run's schedule once JavaScript hands it over: keeps the Live Activity on the current
/// step and plays each cue on time, with the app open or in the background. Main thread only.
final class TimerController {
  static let shared = TimerController()

  static var activitiesEnabled: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

  private let cues = CueEngine()
  private var json: String?
  private var payload: Payload?
  private var syncedAt = Date()
  private var activity: Activity<NativeTimerAttributes>?
  private var shown: NativeTimerAttributes.ContentState?
  private var dismissed: String?
  private var fired = Set<String>()
  private var timer: DispatchSourceTimer?
  private var watch: Task<Void, Never>?

  /// Cues this late are skipped rather than played out of time.
  private let lateMs = 500.0

  func sync(_ next: String?) {
    guard next != json else { return }
    json = next
    guard let next, let data = next.data(using: .utf8),
      let decoded = try? JSONDecoder().decode(Payload.self, from: data)
    else { return end() }
    if decoded.runId != payload?.runId { fired.removeAll() }
    payload = decoded
    syncedAt = Date()
    step()
  }

  private func end() {
    payload = nil
    timer?.cancel()
    timer = nil
    cues.stop()
    let ending = Activity<NativeTimerAttributes>.activities
    activity = nil
    shown = nil
    watch?.cancel()
    Task {
      for a in ending { await a.end(nil, dismissalPolicy: .immediate) }
    }
  }

  /// Plays what is due, shows the step that is on, and waits for whatever comes next.
  private func step() {
    timer?.cancel()
    timer = nil
    guard let payload else { return }
    let now = Date().timeIntervalSince1970 * 1000
    let audible = !payload.muted && !payload.paused
    var ahead: Double?
    for (i, step) in payload.steps.enumerated() {
      if let end = step.endsAt, end > now, i + 1 < payload.steps.count {
        ahead = min(ahead ?? end, end)
      }
      guard audible else { continue }
      for cue in step.cues {
        let key = "\(cue.at):\(cue.sound)"
        if fired.contains(key) { continue }
        if cue.at <= now + 15 {
          fired.insert(key)
          if cue.at >= now - lateMs { play(cue.sound) }
        } else {
          ahead = min(ahead ?? cue.at, cue.at)
        }
      }
    }
    let wantsAudio = audible && ahead != nil
    if wantsAudio { cues.start() } else { cues.stop() }
    show(payload, now)
    guard let ahead else { return }
    let t = DispatchSource.makeTimerSource(queue: .main)
    t.schedule(wallDeadline: .now() + max(0, (ahead - now) / 1000), leeway: .milliseconds(5))
    t.setEventHandler { [weak self] in self?.step() }
    t.resume()
    timer = t
  }

  private func play(_ sound: String) {
    cues.start()
    cues.play(sound)
  }

  private func show(_ payload: Payload, _ now: Double) {
    guard Self.activitiesEnabled, payload.runId != dismissed,
      let index = payload.current(at: now)
    else { return }
    let step = payload.steps[index]
    let next = payload.steps.indices.contains(index + 1) ? payload.steps[index + 1] : nil
    var state = NativeTimerAttributes.ContentState(
      look: step.look, label: step.label, hint: step.hint, setLine: step.setLine,
      startsAt: date(step.startsAt), endsAt: step.endsAt.map(date), runShare: step.runShare,
      nextLabel: next?.label, pausedLeftS: payload.pausedLeftS, pausedShare: payload.pausedShare,
      pausedText: payload.pausedText, nextText: payload.nextText, openHint: payload.openHint)
    if let left = payload.pausedLeftS {
      state.startsAt = syncedAt
      state.endsAt = syncedAt.addingTimeInterval(TimeInterval(left))
    }
    guard state != shown || activity?.attributes.runId != payload.runId else { return }
    shown = state
    let stale = payload.paused ? nil : state.endsAt
    let content = ActivityContent(state: state, staleDate: stale)
    if let current = activity ?? adopt(payload.runId) {
      Task { await current.update(content) }
      return
    }
    for a in Activity<NativeTimerAttributes>.activities {
      Task { await a.end(nil, dismissalPolicy: .immediate) }
    }
    do {
      let started = try Activity.request(
        attributes: NativeTimerAttributes(runId: payload.runId, title: payload.title),
        content: content, pushType: nil)
      activity = started
      watchDismissal(started)
    } catch {
      NSLog("NativeTimer: Live Activity not started: \(error)")
    }
  }

  /// An activity left from before the app was relaunched, for the same run.
  private func adopt(_ runId: String) -> Activity<NativeTimerAttributes>? {
    guard let found = Activity<NativeTimerAttributes>.activities.first(where: {
      $0.attributes.runId == runId && $0.activityState == .active
    }) else {
      activity = nil
      return nil
    }
    for other in Activity<NativeTimerAttributes>.activities where other.id != found.id {
      Task { await other.end(nil, dismissalPolicy: .immediate) }
    }
    activity = found
    watchDismissal(found)
    return found
  }

  private func watchDismissal(_ a: Activity<NativeTimerAttributes>) {
    watch?.cancel()
    watch = Task { @MainActor [weak self] in
      for await state in a.activityStateUpdates {
        guard let self else { return }
        if state == .dismissed { self.dismissed = a.attributes.runId }
        if state == .dismissed || state == .ended {
          if self.activity?.id == a.id { self.activity = nil }
          return
        }
      }
    }
  }
}
