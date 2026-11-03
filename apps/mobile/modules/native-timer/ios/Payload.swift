import Foundation

/// What JavaScript hands over: the run's upcoming steps with absolute times in milliseconds.
struct Payload: Decodable, Equatable {
  struct Cue: Decodable, Equatable {
    let at: Double
    let sound: String
  }

  struct Step: Decodable, Equatable {
    let look: String
    let label: String
    let hint: String?
    let next: String?
    let setLine: String
    let startsAt: Double
    let endsAt: Double?
    let runShare: Double
    let cues: [Cue]
  }

  let runId: String
  let title: String
  let meta: String
  let muted: Bool
  let steps: [Step]
  let pausedLeftS: Int?
  let pausedShare: Double?
  let pausedText: String
  let nextText: String
  let openHint: String

  var paused: Bool { pausedLeftS != nil }

  /// The step on at `now`: the last one already started, never past one that waits.
  func current(at now: Double) -> Int? {
    var index: Int?
    for (i, step) in steps.enumerated() where step.startsAt <= now {
      index = i
      if step.endsAt == nil { break }
    }
    return index ?? (steps.isEmpty ? nil : 0)
  }
}

func date(_ ms: Double) -> Date { Date(timeIntervalSince1970: ms / 1000) }
