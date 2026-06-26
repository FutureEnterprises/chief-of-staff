// Project-level autolinking override.
//
// In this pnpm monorepo, the `expo` package's own react-native.config.js throws
// when it does `require('expo-modules-autolinking/exports')` (the subpath isn't
// resolvable from the isolated .pnpm store layout). The Android autolinker then
// can't read expo's intended import and falls back to deriving it from the
// gradle namespace `expo.core`, emitting `import expo.core.ExpoModulesPackage;`.
// That class doesn't exist — the real one is `expo.modules.ExpoModulesPackage`
// (expo/android/src/main/java/expo/modules/ExpoModulesPackage.kt) — so the
// generated PackageList.java fails to compile (compileReleaseJavaWithJavac).
//
// Override the expo dependency's Android import explicitly so the generated
// PackageList.java references the correct class regardless of the broken
// auto-detection. iOS is unaffected (it uses CocoaPods autolinking).
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: {
          packageImportPath: 'import expo.modules.ExpoModulesPackage;',
          packageInstance: 'new ExpoModulesPackage()',
        },
      },
    },
  },
}
