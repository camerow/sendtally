Pod::Spec.new do |s|
  s.name           = 'MetaInstall'
  s.version        = '1.0.0'
  s.summary        = 'Starts the Meta SDK so Meta can count installs from our ads'
  s.description    = 'Starts the Meta SDK at launch, and only when the build carries a client token'
  s.license        = 'UNLICENSED'
  s.author         = 'sendtally'
  s.homepage       = 'https://sendtally.com'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'FBSDKCoreKit', '18.1.1'

  s.source_files = '*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
