Pod::Spec.new do |s|
  s.name           = 'CoylVoice'
  s.version        = '1.0.0'
  s.summary        = 'COYL Voice bridge — JS API around AVSpeechSynthesizer with three voice tiers.'
  s.description    = <<-DESC
    Exposes speak() / isVoiceAvailable() / setPreferredVoice() to React
    Native. Three voice tiers (gentle / firm / urgent) map to specific
    AVSpeechSynthesisVoice + rate + pitch combinations so the same JS
    call site can produce a soft recovery prompt, a firm autopilot
    interruption, or an urgent safety nudge.
  DESC
  s.author         = { 'COYL' => 'iman.schrock@gmail.com' }
  s.homepage       = 'https://coyl.ai'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '14.0' }
  s.swift_version  = '5.4'

  s.source         = { :git => '' }
  s.source_files   = 'ios/**/*.{swift}'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
