Pod::Spec.new do |s|
  s.name           = 'CoylWatch'
  s.version        = '1.0.0'
  s.summary        = 'COYL Watch bridge — JS API around WatchConnectivity + App Group writes.'
  s.description    = <<-DESC
    Phone-side WatchConnectivity bridge for the COYL Watch app.
    Exposes sendIntervention (fires haptic on the wrist),
    syncDailyNumber (App Group write + complication reload), and
    isWatchPaired. The paired Watch app lives in
    apps/mobile/ios/COYLWatch/.
  DESC
  s.author         = { 'COYL' => 'iman.schrock@gmail.com' }
  s.homepage       = 'https://coyl.ai'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '13.0' }
  s.swift_version  = '5.4'

  s.source         = { :git => '' }
  s.source_files   = '**/*.{swift}'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
