Pod::Spec.new do |s|
  s.name           = 'NativeTimer'
  s.version        = '1.0.0'
  s.summary        = 'The running workout timer on the Lock Screen and in the Dynamic Island'
  s.author         = 'sendtally'
  s.homepage       = 'https://sendtally.com'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.resource_bundles = { 'NativeTimerSounds' => ['Sounds/{tick,work,rest,finish}.wav'] }
  s.frameworks = 'ActivityKit', 'AVFoundation'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
