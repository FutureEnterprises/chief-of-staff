#!/usr/bin/env ruby
# Adds the COYLWidget app-extension target (iOS Live Activity) to the
# committed bare-workflow Xcode project, wiring its Swift sources, Info.plist,
# entitlements, App Group, deployment target, and embedding the .appex into
# the main COYL app. Idempotent: re-running is a no-op if the target exists.
#
# Uses the `xcodeproj` gem (the same library CocoaPods uses) rather than
# hand-editing the pbxproj, so UUIDs / build phases / embed specs stay valid.
require 'xcodeproj'

PROJECT = 'ios/COYL.xcodeproj'
TARGET_NAME = 'COYLWidget'
HOST_NAME = 'COYL'
WIDGET_BUNDLE_ID = 'ai.coyl.app.widget'
APP_GROUP = 'group.com.coyl.shared'
SOURCES = %w[
  COYLInterruptAttributes.swift
  COYLInterruptLiveActivity.swift
  COYLInterruptIntents.swift
  COYLWidgetBundle.swift
]

proj = Xcodeproj::Project.open(PROJECT)
host = proj.targets.find { |t| t.name == HOST_NAME }
abort "host target #{HOST_NAME} not found" unless host

if proj.targets.any? { |t| t.name == TARGET_NAME }
  puts "target #{TARGET_NAME} already exists — nothing to do"
  exit 0
end

# 1. Create the app-extension target (Swift, iOS 17.0 — Button(intent:) is 17+).
widget = proj.new_target(:app_extension, TARGET_NAME, :ios, '17.0', nil, :swift)

# 2. Group + file references (point at the existing files; don't copy).
group = proj.main_group.find_subpath(TARGET_NAME, true)
group.set_source_tree('SOURCE_ROOT')
group.set_path(TARGET_NAME)

SOURCES.each do |fname|
  ref = group.new_reference(fname)
  widget.add_file_references([ref])
end
# Info.plist + entitlements are referenced via build settings, not compiled.
group.new_reference('Info.plist')
group.new_reference("#{TARGET_NAME}.entitlements")

# 3. Build settings on both configurations.
widget.build_configurations.each do |config|
  bs = config.build_settings
  bs['PRODUCT_BUNDLE_IDENTIFIER'] = WIDGET_BUNDLE_ID
  bs['PRODUCT_NAME'] = '$(TARGET_NAME)'
  bs['INFOPLIST_FILE'] = "#{TARGET_NAME}/Info.plist"
  bs['CODE_SIGN_ENTITLEMENTS'] = "#{TARGET_NAME}/#{TARGET_NAME}.entitlements"
  bs['IPHONEOS_DEPLOYMENT_TARGET'] = '17.0'
  bs['TARGETED_DEVICE_FAMILY'] = '1,2'
  bs['SWIFT_VERSION'] = '5.0'
  bs['GENERATE_INFOPLIST_FILE'] = 'NO'
  bs['SKIP_INSTALL'] = 'YES'
  bs['CURRENT_PROJECT_VERSION'] = '1'
  bs['MARKETING_VERSION'] = '1.0'
  bs['CODE_SIGN_STYLE'] = 'Automatic'
  bs['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  bs['SWIFT_EMIT_LOC_STRINGS'] = 'YES'
  bs['CLANG_ENABLE_MODULES'] = 'YES'
  bs['ENABLE_BITCODE'] = 'NO'
  if config.name == 'Debug'
    bs['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
    bs['SWIFT_ACTIVE_COMPILATION_CONDITIONS'] = 'DEBUG'
  else
    bs['SWIFT_OPTIMIZATION_LEVEL'] = '-O'
  end
end

# 4. Main app depends on the widget so it builds first.
host.add_dependency(widget)

# 5. Embed the .appex into the host app (PlugIns dir, sign on copy).
embed = host.new_copy_files_build_phase('Embed App Extensions')
embed.symbol_dst_subfolder_spec = :plug_ins
build_file = embed.add_file_reference(widget.product_reference)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy', 'CodeSignOnCopy'] }

proj.save
puts "added target #{TARGET_NAME} (#{WIDGET_BUNDLE_ID}), #{SOURCES.length} sources, embedded into #{HOST_NAME}"
puts "targets now: #{proj.targets.map(&:name).join(', ')}"
