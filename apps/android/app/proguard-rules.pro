# Keep EAP coordinator entrypoints reflection-safe
-keep class ai.coyl.eap.** { *; }

# Health Connect uses reflection for record types
-keep class androidx.health.connect.client.records.** { *; }

# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
