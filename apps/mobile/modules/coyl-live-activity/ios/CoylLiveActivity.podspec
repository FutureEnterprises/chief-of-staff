Pod::Spec.new do |s|
  s.name           = 'CoylLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'COYL Live Activity bridge — JS API around ActivityKit + App Group token write.'
  s.description    = <<-DESC
    Exposes start/update/end of an ActivityKit Live Activity to React
    Native, plus a setAuthToken helper that writes the Clerk JWT into
    the group.com.coyl.shared App Group so the widget extension's App
    Intents can authenticate against the COYL API.
  DESC
  s.author         = { 'COYL' => 'iman.schrock@gmail.com' }
  s.homepage       = 'https://coyl.ai'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.1' }
  s.swift_version  = '5.4'

  s.source         = { :git => '' }
  s.source_files   = '**/*.{swift}'

  s.dependency 'ExpoModulesCore'

  # Suppress warnings for the new arch in case the host project enables it.
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
