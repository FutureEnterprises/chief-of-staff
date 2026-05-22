plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.gms.google-services")
}

android {
    namespace = "ai.coyl.eap"
    compileSdk = 34

    defaultConfig {
        applicationId = "ai.coyl.eap"
        minSdk = 26 // Health Connect requires Android 8.0+; Foreground service data_sync needs API 26+
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // EAP coordinator base URL — overridable via build variant or BuildConfig in CI
        buildConfigField("String", "EAP_BASE_URL", "\"https://coyl.ai\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // TODO(founder): generate release keystore via `keytool -genkey -v -keystore release.jks ...`
            // then add a `signingConfigs.release { ... }` block + `signingConfig = signingConfigs.getByName("release")` here.
            // The debug keystore is used until a release keystore is wired up.
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.0")
    implementation("androidx.lifecycle:lifecycle-service:2.8.0")
    implementation("androidx.activity:activity-compose:1.9.0")

    // Compose UI (ConsentActivity)
    val composeBom = platform("androidx.compose:compose-bom:2024.05.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // Health Connect (HRV, sleep, steps)
    implementation("androidx.health.connect:connect-client:1.1.0-alpha07")

    // Activity Recognition (Google Play Services)
    implementation("com.google.android.gms:play-services-location:21.3.0")

    // Firebase Cloud Messaging (push delivery of EAP actions)
    implementation(platform("com.google.firebase:firebase-bom:33.0.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")

    // WorkManager — periodic health ingest + complication refresh
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // OkHttp + kotlinx.serialization — talk to coyl.ai EAP endpoints
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // Encrypted SharedPreferences (Tink-backed) for auth token storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Wearable DataLayer — phone-side companion to the wear module
    implementation("com.google.android.gms:play-services-wearable:18.2.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.0")

    // Tests
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
