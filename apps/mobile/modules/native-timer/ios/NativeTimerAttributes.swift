import ActivityKit
import Foundation

/// The running timer as the Lock Screen and Dynamic Island draw it. Shared, as one file, by the
/// app's module and the widget extension; ActivityKit matches the two by this type's name.
struct NativeTimerAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var look: String
    var label: String
    var hint: String?
    var setLine: String
    var startsAt: Date
    var endsAt: Date?
    var runShare: Double
    var nextLabel: String?
    var pausedLeftS: Int?
    var pausedShare: Double?
    var pausedText: String
    var nextText: String
    var openHint: String
  }

  var runId: String
  var title: String
}
