Pod::Spec.new do |s|
  s.name           = 'CoylHealthBridge'
  s.version        = '1.0.0'
  s.summary        = 'COYL passive-signals bridge — HealthKit + CoreMotion + CoreLocation + DeviceActivity.'
  s.description    = <<-DESC
    Layer 1 substrate of the "Honest Gap" architecture. Bridges
    HRV, sedentary time, screen-time category usage, and geofence-
    only home/kitchen classification to JS, plus a flush call that
    POSTs accumulated samples to coyl.ai/api/v1/health/ingest with
    the auth token stored in the shared App Group.
  DESC
  s.author         = { 'COYL' => 'iman.schrock@gmail.com' }
  s.homepage       = 'https://coyl.ai'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.1' }
  s.swift_version  = '5.4'

  s.source         = { :git => '' }
  s.source_files   = '**/*.{swift}'

  s.dependency 'ExpoModulesCore'

  # System frameworks. HealthKit + CoreMotion + CoreLocation are
  # always linked. DeviceActivity / FamilyControls / ManagedSettings
  # are weak-linked via #if canImport guards in the Swift source so
  # iOS 16 devices still load the binary cleanly.
  s.frameworks       = ['HealthKit', 'CoreMotion', 'CoreLocation']
  s.weak_frameworks  = ['DeviceActivity', 'FamilyControls', 'ManagedSettings']

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
