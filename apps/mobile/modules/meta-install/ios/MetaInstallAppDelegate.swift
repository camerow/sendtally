import ExpoModulesCore
import FBSDKCoreKit

public class MetaInstallAppDelegate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let clientToken = Bundle.main.object(forInfoDictionaryKey: "FacebookClientToken") as? String
    if clientToken?.isEmpty == false {
      ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)
    }
    return true
  }
}
