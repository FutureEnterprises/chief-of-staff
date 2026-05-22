// COYL Android Auto module — :auto
//
// This is a sibling module to :app that hosts the CarAppService
// surface for Android Auto (and, in principle, Android Automotive OS
// — the embedded-in-car variant — though we don't claim a separate
// distribution for AAOS yet; see CARPLAY_ANDROID_AUTO.md).
//
// Why a separate module? Two reasons:
//   1. The Apps for Cars Library (`androidx.car.app`) pulls in a
//      fairly heavy set of templates + lifecycle scaffolding that
//      would inflate the main app's APK if compiled in unconditionally
//      for users who never plug into a car.
//   2. The Auto module has a different host-validation posture than
//      the main app — we whitelist car hosts here, not in :app.
//
// Honest scope: Android Auto third-party UI is template-only. We can
// render PaneTemplate, ListTemplate, MessageTemplate, GridTemplate,
// SearchTemplate, and a few navigation-only templates (PlaceList-
// MapTemplate / NavigationTemplate — both require the Navigation
// category which COYL is not). We CANNOT render custom Compose UI,
// cannot fire driver-distracting overlays, and cannot override the
// car's audio focus.
//
// Approval path: Google does NOT require pre-approval to compile and
// run this module on a developer device, but distribution through
// Play requires Apps for Cars certification (~1-3 week review, ~85%
// approval rate if the templates stay within the documented
// constraints). See CARPLAY_ANDROID_AUTO.md for the founder TODO.

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "ai.coyl.auto"
    compileSdk = 35

    defaultConfig {
        minSdk = 26  // matches :app — Android 8.0 is the floor
        targetSdk = 35

        // Required by androidx.car.app — the library's manifest
        // declares queries against the car-host packages, and that
        // requires PackageManager queries support which has been
        // present since 26 but we still pin to ensure we don't
        // accidentally drop below.
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // The :auto module ships as an AAR consumed by :app. :app's
    // AndroidManifest gets the CarAppService entry merged in by the
    // manifest merger because of the <service> declaration in
    // src/main/AndroidManifest.xml below.
}

dependencies {
    // Apps for Cars Library — Google's official path for non-
    // automaker third-party apps to render templated UI in Android
    // Auto (phone-projected) and Android Automotive OS (embedded).
    //
    // 1.4.0 is the current stable as of May 2026 and includes
    // PaneTemplate, MessageTemplate, ListTemplate, plus the
    // HostValidator changes that landed in 1.3.x.
    implementation("androidx.car.app:app:1.4.0")

    // Lifecycle — Session + Screen both extend lifecycle-aware
    // classes; we pull this in transitively from car.app:app but
    // declare it explicitly so the version is pinned predictably.
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")

    // Coroutines — for the suspend-fun network calls in
    // CoylScreen.kt. The same versions used in :app.
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // OkHttp for the actual HTTP calls to coyl.ai/api/v1/* and
    // /api/eap/v1/*. :app uses the same client; we declare locally
    // so the :auto module is self-contained for the library AAR.
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
