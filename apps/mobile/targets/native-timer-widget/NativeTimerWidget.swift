import ActivityKit
import SwiftUI
import WidgetKit

@main
struct NativeTimerBundle: WidgetBundle {
  var body: some Widget {
    NativeTimerLiveActivity()
  }
}

private let live = URL(string: "sendtally://live")

private extension Color {
  init(hex: UInt32, opacity: Double = 1) {
    self.init(
      .sRGB, red: Double((hex >> 16) & 0xff) / 255, green: Double((hex >> 8) & 0xff) / 255,
      blue: Double(hex & 0xff) / 255, opacity: opacity)
  }

  static let gunmetal = Color(hex: 0x403F4C)
  static let onDarkSoft = Color(hex: 0xEED3F8, opacity: 0.88)
  static let onDarkMuted = Color(hex: 0xEED3F8, opacity: 0.8)
  static let onDarkTrack = Color(hex: 0xEED3F8, opacity: 0.16)
}

private extension Font {
  static func mono(_ size: CGFloat, semibold: Bool = false) -> Font {
    .custom(semibold ? "IBMPlexMono-SemiBold" : "IBMPlexMono-Medium", size: size)
  }
}

/// What the step on screen is doing, which picks every layout below.
private enum Mode {
  case running(ClosedRange<Date>)
  case paused(ClosedRange<Date>, share: Double)
  case waiting
  case stale
  case done
}

private struct Look {
  let mark: Color
  let label: Color

  init(_ look: String) {
    switch look {
    case "work": (mark, label) = (Color(hex: 0x4A8FFC), Color(hex: 0xA9C9FD))
    case "rest": (mark, label) = (Color(hex: 0x29AE70), Color(hex: 0x9FCFB8))
    case "done": (mark, label) = (.white, .white)
    default: (mark, label) = (.onDarkSoft, .white)
    }
  }
}

private struct Shown {
  let state: NativeTimerAttributes.ContentState
  let mode: Mode
  let look: Look

  init(_ state: NativeTimerAttributes.ContentState, stale: Bool) {
    self.state = state
    look = Look(state.look)
    let range = state.endsAt.flatMap { $0 > state.startsAt ? state.startsAt...$0 : nil }
    if state.look == "done" {
      mode = .done
    } else if let range, state.pausedLeftS != nil {
      mode = .paused(range, share: state.pausedShare ?? 0)
    } else if range == nil {
      mode = .waiting
    } else if stale || (state.endsAt ?? .distantFuture) <= Date() {
      mode = .stale
    } else {
      mode = .running(range!)
    }
  }

  var kicker: String {
    switch mode {
    case .paused: state.pausedText
    case .stale: state.nextText
    default: state.label
    }
  }

  /// A paused step's time left, which never moves, so plain text: "0:41".
  var pausedClock: String {
    let left = state.pausedLeftS ?? 0
    return String(format: "%d:%02d", left / 60, left % 60)
  }

  var kickerColor: Color {
    if case .stale = mode { return .onDarkMuted }
    return look.label
  }
}

struct NativeTimerLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NativeTimerAttributes.self) { context in
      LockScreen(title: context.attributes.title, shown: Shown(context.state, stale: context.isStale))
        .activityBackgroundTint(.gunmetal)
        .activitySystemActionForegroundColor(.white)
        .widgetURL(live)
    } dynamicIsland: { context in
      let shown = Shown(context.state, stale: context.isStale)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Kicker(text: shown.kicker, color: shown.kickerColor)
            Text(shown.state.setLine)
              .font(.mono(13))
              .foregroundStyle(Color.onDarkMuted)
              .lineLimit(1)
          }
          .padding(.leading, 6)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Big(shown: shown, size: 40, hintSize: 20)
            .padding(.trailing, 6)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 8) {
            Bar(shown: shown)
            NextRow(shown: shown, inline: true)
          }
          .padding(.horizontal, 6)
        }
      } compactLeading: {
        Ring(shown: shown).frame(width: 22, height: 22)
      } compactTrailing: {
        CompactTrailing(shown: shown)
      } minimal: {
        Ring(shown: shown).frame(width: 22, height: 22)
      }
      .widgetURL(live)
      .keylineTint(shown.look.mark)
    }
  }
}

private struct LockScreen: View {
  let title: String
  let shown: Shown

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .firstTextBaseline) {
        Text(title)
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(.white)
          .lineLimit(1)
        Spacer(minLength: 8)
        Text(shown.state.setLine)
          .font(.mono(13))
          .foregroundStyle(Color.onDarkMuted)
          .lineLimit(1)
      }
      HStack(alignment: .bottom) {
        VStack(alignment: .leading, spacing: 0) {
          Kicker(text: shown.kicker, color: shown.kickerColor)
          Big(shown: shown, size: 52, hintSize: 24)
        }
        Spacer(minLength: 8)
        NextRow(shown: shown, inline: false)
      }
      Bar(shown: shown)
    }
    .padding(16)
  }
}

private struct Kicker: View {
  let text: String
  let color: Color

  var body: some View {
    Text(text.uppercased())
      .font(.mono(13))
      .tracking(13 * 0.14)
      .foregroundStyle(color)
      .lineLimit(1)
  }
}

/// The countdown, or what stands in its place when there is no clock to run.
private struct Big: View {
  let shown: Shown
  let size: CGFloat
  let hintSize: CGFloat

  var body: some View {
    switch shown.mode {
    case .running(let range):
      Text(timerInterval: range, countsDown: true)
        .font(.mono(size, semibold: true))
        .monospacedDigit()
        .foregroundStyle(.white)
        .frame(width: size * 2.6, alignment: .leading)
        .contentTransition(.numericText())
    case .paused:
      Text(shown.pausedClock)
        .font(.mono(size, semibold: true))
        .monospacedDigit()
        .foregroundStyle(Color.onDarkMuted)
        .frame(width: size * 2.6, alignment: .leading)
    case .stale:
      Text(shown.state.nextLabel ?? shown.state.openHint)
        .font(.system(size: hintSize, weight: .semibold))
        .foregroundStyle(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    case .waiting, .done:
      Text(shown.state.hint ?? "")
        .font(.system(size: hintSize, weight: .semibold))
        .foregroundStyle(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    }
  }
}

/// "Next" over the label of the step after, or the invitation to open the app once stale.
private struct NextRow: View {
  let shown: Shown
  let inline: Bool

  var body: some View {
    if case .stale = shown.mode {
      Text(shown.state.openHint)
        .font(.system(size: 14))
        .foregroundStyle(Color.onDarkSoft)
        .lineLimit(1)
    } else if let next = shown.state.nextLabel, !isDone {
      let kicker = Text(shown.state.nextText.uppercased())
        .font(.mono(13))
        .tracking(13 * 0.14)
        .foregroundStyle(Color.onDarkMuted)
      let label = Text(next)
        .font(.system(size: 14))
        .foregroundStyle(Color.onDarkSoft)
      if inline {
        HStack(spacing: 8) {
          kicker
          label.lineLimit(1)
          Spacer(minLength: 0)
        }
      } else {
        VStack(alignment: .trailing, spacing: 2) {
          kicker
          label.lineLimit(1)
        }
        .padding(.bottom, 8)
      }
    }
  }

  private var isDone: Bool {
    if case .done = shown.mode { return true }
    return false
  }
}

/// The step's own progress, drawn by the system; no bar without a running or paused clock.
private struct Bar: View {
  let shown: Shown

  var body: some View {
    switch shown.mode {
    case .running(let range):
      ProgressView(timerInterval: range, countsDown: false) {
        EmptyView()
      } currentValueLabel: {
        EmptyView()
      }
      .progressViewStyle(.linear)
      .tint(shown.look.mark)
      .modifier(Track())
    case .paused(_, let share):
      ProgressView(value: min(1, max(0, share)))
        .progressViewStyle(.linear)
        .tint(shown.look.mark)
        .modifier(Track())
    default:
      EmptyView()
    }
  }
}

private struct Track: ViewModifier {
  func body(content: Content) -> some View {
    content
      .scaleEffect(x: 1, y: 1.5, anchor: .center)
      .frame(height: 6)
      .background(Capsule().fill(Color.onDarkTrack))
      .clipShape(Capsule())
  }
}

private struct Ring: View {
  let shown: Shown

  var body: some View {
    switch shown.mode {
    case .running(let range):
      ProgressView(timerInterval: range, countsDown: false) {
        EmptyView()
      } currentValueLabel: {
        EmptyView()
      }
      .progressViewStyle(.circular)
      .tint(shown.look.mark)
    case .paused(_, let share):
      ProgressView(value: min(1, max(0, share))) {
        EmptyView()
      }
      .progressViewStyle(.circular)
      .tint(shown.look.mark)
    case .waiting:
      Circle().stroke(shown.look.mark, lineWidth: 3).padding(1.5)
    case .stale:
      Circle().stroke(Color.onDarkTrack, lineWidth: 3).padding(1.5)
    case .done:
      ZStack {
        Circle().fill(.white)
        Check().stroke(Color.gunmetal, style: StrokeStyle(lineWidth: 2.4, lineCap: .round, lineJoin: .round))
          .padding(4)
      }
    }
  }
}

/// The app's check icon, the same path as `check` in `components/Icon.tsx` on a 24 grid.
private struct Check: Shape {
  func path(in rect: CGRect) -> Path {
    let s = min(rect.width, rect.height) / 24
    var p = Path()
    p.move(to: CGPoint(x: rect.minX + 5 * s, y: rect.minY + 12.5 * s))
    p.addLine(to: CGPoint(x: rect.minX + 9.5 * s, y: rect.minY + 17 * s))
    p.addLine(to: CGPoint(x: rect.minX + 19 * s, y: rect.minY + 7 * s))
    return p
  }
}

private struct CompactTrailing: View {
  let shown: Shown

  var body: some View {
    switch shown.mode {
    case .running(let range):
      Text(timerInterval: range, countsDown: true)
        .font(.mono(15, semibold: true))
        .monospacedDigit()
        .foregroundStyle(shown.look.label)
        .frame(width: 44, alignment: .trailing)
    case .paused:
      Text(shown.pausedClock)
        .font(.mono(15, semibold: true))
        .monospacedDigit()
        .foregroundStyle(Color.onDarkMuted)
        .frame(width: 44, alignment: .trailing)
    case .waiting, .done:
      Text(shown.state.label)
        .font(.mono(15, semibold: true))
        .foregroundStyle(shown.look.label)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .frame(maxWidth: 52, alignment: .trailing)
    case .stale:
      EmptyView()
    }
  }
}
