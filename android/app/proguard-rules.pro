# R8 rules for RIFQ Muslim. Shrinking is disabled in build.gradle.kts, but these
# rules keep the build correct if it is enabled later.
-keepclassmembers class com.rifqmuslim.app.WebAppBridge {
    public *;
}

-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.rifqmuslim.app.PrayerAlarmReceiver { *; }
-keep class com.rifqmuslim.app.BootReceiver { *; }
