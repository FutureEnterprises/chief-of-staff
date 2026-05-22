Pod::Spec.new do |s|
  s.name           = 'CoylEAPCoordinator'
  s.version        = '1.0.0'
  s.summary        = 'COYL Edge AI Protocol coordinator — device fingerprint, operational state, scope grants, App Intent dispatch.'
  s.description    = <<-DESC
    Native iOS bridge for the EAP coordinator. Owns the operations
    that can't be done from JS: persistent device fingerprint in the
    shared App Group, battery + DND + foreground-app snapshot for
    device.register manifests, user-granted EAP scope read/write in
    the App Group, and named App Intent dispatch via NSUserActivity.

    Action execution, sensor publication, HTTP calls to
    /api/eap/v1/*, and BGTaskScheduler registration all live in
    apps/mobile/lib/eap-coordinator.ts — this pod is intentionally
    thin.

    Requires App Group entitlement "group.com.coyl.shared". The
    fingerprint key is "coyl.eap.deviceFingerprint"; the scope list
    key is "coyl.eap.userGrantedScopes". Both keys are read by the
    COYLWidget extension and the Watch app.
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
