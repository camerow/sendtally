import ExpoModulesCore

public class NativeTimerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeTimer")

    Function("sync") { (json: String?) in
      DispatchQueue.main.async { TimerController.shared.sync(json) }
    }

    Function("areActivitiesEnabled") { () -> Bool in
      TimerController.activitiesEnabled
    }
  }
}
