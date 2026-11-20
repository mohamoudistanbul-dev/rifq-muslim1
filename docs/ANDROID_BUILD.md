# RIFQ Muslim — Native Android Build & Release

RIFQ Muslim ships as a **real native Android application** (`com.rifqmuslim.app`)
built with the official Android Gradle Plugin. It is not a PWA, not a browser
shortcut and not a Chrome-based wrapper: the app has its own package, icon,
splash screen, label, notifications, permissions and Android back handling, and
it appears independently in the app drawer and in Recent Apps with no browser
chrome (no address bar, no tabs, no Chrome branding).

**Made by Eng Mohamud Yusuf.**

---

## 1. What is in this project

```
android/
├── settings.gradle.kts            Module + repository configuration
├── build.gradle.kts               AGP 8.7.3 + Kotlin 2.0.21 (declared once)
├── gradle.properties              Brand defaults, HTTPS app URL override
├── gradlew / gradlew.bat          Official Gradle 8.9 wrapper
├── gradle/wrapper/                Wrapper jar + distribution config
├── keystore.properties.example    Release signing template (no secrets)
└── app/
    ├── build.gradle.kts           applicationId, SDK levels, signing, BuildConfig
    ├── proguard-rules.pro         Keep rules for the WebView bridge
    └── src/main/
        ├── AndroidManifest.xml    Permissions, launcher activity, receivers
        ├── assets/rifq-native.js  Notification bridge shim
        ├── java/com/rifqmuslim/app/
        │   ├── MainActivity.kt        Full-screen shell, back nav, permissions
        │   ├── WebAppBridge.kt        window.RifqNative JavaScript API
        │   ├── PrayerNotifications.kt Notification channel + exact alarms
        │   ├── PrayerAlarmReceiver.kt Posts the Athan notification
        │   └── BootReceiver.kt        Restores reminders after reboot
        └── res/                   Branded icons, splash, theme, HTTPS config
```

The client application itself (screens, prayer calculation, Quran, Hadith, Duas,
Tasbih, Qibla, Zakat, community, accounts, admin) is the existing verified RIFQ
Muslim app served over HTTPS; the native shell loads it full-screen and adds
everything Android-specific. All existing features, navigation, saved data and
the emerald/gold design are preserved — nothing is replaced by placeholders.

---

## 2. Honest status of the binary artifacts

| Item | Status |
| --- | --- |
| Complete Android source project | ✅ Provided in `android/` |
| Gradle wrapper (8.9) included and verified | ✅ Yes |
| Branded icon, adaptive icon, splash, theme | ✅ Provided |
| Native notifications, permissions, back navigation, HTTPS-only | ✅ Implemented |
| GitHub Actions workflow to build the APK | ✅ `.github/workflows/android-apk.yml` (see §4 note) |
| **Compiled `app-debug.apk` / `app-release.apk`** | ❌ **Not built here** |
| **Signed `app-release.aab`** | ❌ **Not built here** |
| Install-and-launch test on a device/emulator | ❌ **Not performed here** |

**Why:** the environment used to write this code has no Android SDK
(`sdkmanager`, `aapt2`, `d8`, `apksigner`), no Gradle Android plugin resolution
and no device or emulator, and AppJet delivers native Android work as source
only. Compiling an APK requires the Android toolchain, which must run on your
machine, in Android Studio, or in CI. **No APK has been produced or tested yet —
the commands in §4 produce it.**

---

## 3. Prerequisites

- **JDK 17** (`java -version` → 17.x). AGP 8.7 requires JDK 17+.
- **Android SDK Platform 35** and **Build-Tools 35.x** via Android Studio
  (`Settings → Languages & Frameworks → Android SDK`) or `sdkmanager`:
  ```bash
  sdkmanager "platforms;android-35" "build-tools;35.0.0" "platform-tools"
  ```
- Accept the licenses: `yes | sdkmanager --licenses`
- Either **Android Studio** (easiest) or the SDK command-line tools.

Create `android/local.properties` so Gradle finds the SDK (Android Studio writes
this for you; the file is git-ignored):

```properties
sdk.dir=/absolute/path/to/Android/Sdk
```

---

## 4. Build the APK and AAB

All commands run from the `android/` directory.

> **Prefer CI?** `.github/workflows/android-apk.yml` builds the debug APK on a
> GitHub-hosted Ubuntu runner and uploads it as a downloadable artifact — no
> local SDK needed. Running it from an Android phone, downloading the APK, and
> the optional encrypted release-signing setup are described in
> [`docs/GITHUB_ACTIONS_APK.md`](GITHUB_ACTIONS_APK.md).

### 4.1 Debug APK (fastest way to install and test)

```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Windows: use `gradlew.bat assembleDebug`.

### 4.2 Install and launch on a device

Enable **Developer options → USB debugging**, connect the phone, then:

```bash
adb devices                       # confirm the device is listed
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.rifqmuslim.app/.MainActivity
```

Or copy `app-debug.apk` to the phone and open it (allow "Install unknown apps"
for your file manager). The debug APK is signed with the Android debug key, so
it installs for testing but **cannot** be uploaded to Google Play.

### 4.3 Release APK + Play Store AAB

1. Create a keystore (once, keep it safe and back it up):
   ```bash
   keytool -genkeypair -v -keystore rifq-release.jks -alias rifq \
     -keyalg RSA -keysize 4096 -validity 10000
   ```
2. Copy the signing template and fill in your values:
   ```bash
   cp keystore.properties.example keystore.properties
   ```
   ```properties
   storeFile=rifq-release.jks
   storePassword=********
   keyAlias=rifq
   keyPassword=********
   ```
   `keystore.properties` and `*.jks` are git-ignored — never commit them.
3. Build:
   ```bash
   ./gradlew assembleRelease   # signed APK for direct distribution
   ./gradlew bundleRelease     # AAB for Google Play
   ```

Outputs:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

If `keystore.properties` is absent, `assembleRelease` still builds but produces
an **unsigned** APK (Gradle prints no signing configuration); create the
keystore first for a distributable file.

Verify the signature before publishing:

```bash
apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
```

---

## 5. Point the app at your domain

The shell loads its content over HTTPS from one URL, set in
`android/gradle.properties`:

```properties
rifq.appUrl=https://pqjm8aoyzd.dev.onappjet.com
```

It is compiled into `BuildConfig.RIFQ_APP_URL`. Override it for a single build
without editing files:

```bash
./gradlew assembleRelease -Prifq.appUrl=https://your.domain
```

Use an HTTPS URL only. Cleartext HTTP is disabled in
`res/xml/network_security_config.xml` and via `usesCleartextTraffic="false"`, and
`WebSettings.MIXED_CONTENT_NEVER_ALLOW` blocks insecure sub-resources.

---

## 6. Android behaviour implemented in the shell

| Requirement | Implementation |
| --- | --- |
| App name / label | `@string/app_name` = **RIFQ Muslim** |
| Application ID | `com.rifqmuslim.app` |
| Icon | Gold crescent + star on emerald gradient; adaptive icon (API 26+) and PNG fallbacks (API 24-25) |
| Splash screen | `Theme.Rifq.Splash` via `androidx.core:core-splashscreen`, emerald background + gold crescent |
| App drawer / Recent Apps | Own launcher activity; label and icon are RIFQ Muslim, never a browser |
| No browser chrome | Full-screen `WebView` in a plain `FrameLayout`; no toolbar, address bar, tabs or Chrome branding |
| Back navigation | `OnBackPressedDispatcher` walks the web app's history, then exits the app |
| Notifications | `rifq_athan` channel (high importance), `POST_NOTIFICATIONS` request on Android 13+, exact alarms with an idle-safe fallback |
| Reminder durability | Rescheduled after reboot, app update, timezone and clock changes |
| Location | `ACCESS_FINE/COARSE_LOCATION` requested on the geolocation prompt; denial leaves manual city selection working |
| Secure networking | HTTPS-only, system trust store, no cleartext, no mixed content |
| External links | `tel:`, `mailto:`, `whatsapp:` and other HTTPS links open in their own app instead of a browser-in-browser |
| Offline | A branded emerald "no internet connection" screen with tap-to-retry |
| RTL | `android:supportsRtl="true"`; Arabic content renders right-to-left |
| Backup privacy | WebView session profile excluded from cloud backup and device transfer |

### How notifications reach the app

`MainActivity` injects `assets/rifq-native.js` after every page load. The shim
replaces `window.Notification` with an implementation backed by
`NotificationManagerCompat`, so the application's existing
`Notification.requestPermission()` and `new Notification(...)` calls produce real
Android notifications without any change to the web code. It also exposes
`window.RifqNativeBridge.schedulePrayer(id, atMillis, title, body)` and
`cancelPrayer(id)` for Athan alarms that fire even when the app is closed.

### Android platform restrictions (honest notes)

- **Exact alarms.** Android 12+ may require the user to allow "Alarms &
  reminders". Without it the app still schedules the reminder with an inexact
  alarm, which can fire a few minutes late.
- **Battery optimisation.** Aggressive OEM power managers can delay background
  reminders; the user can exempt RIFQ Muslim in system settings.
- **Full Athan audio playback** in the background needs a foreground media
  service, which is not part of this project; notifications currently play the
  system notification sound and vibration on the Athan channel.
- **iOS** is out of scope for this Android build.

---

## 7. Post-install verification checklist

Run through this on the built APK before publishing:

1. App appears in the drawer as **RIFQ Muslim** with the emerald/gold icon.
2. Cold start shows the branded splash, then the Home screen — no white flash.
3. Recent Apps shows the RIFQ Muslim icon and label, not a browser.
4. No address bar, tabs or browser controls anywhere.
5. Android back returns through app screens and then exits the app.
6. Location permission prompt appears; allowing it fills in the real city, and
   denying it leaves manual city selection working.
7. Notifications permission prompt appears; a test prayer reminder arrives.
8. Prayer times match the web app for the same city and method.
9. Quran text, translation, audio and bookmarks work.
10. Arabic switches the layout to right-to-left.
11. Airplane mode shows the branded offline screen; tapping retries.
12. App relaunches cleanly from Recents after being killed.

---

## 8. Versioning for Play Store updates

In `android/app/build.gradle.kts`:

```kotlin
versionCode = 1        // must increase for every Play upload
versionName = "1.0.0"  // shown to users
```

---

## 9. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=...` (§3) |
| `Unsupported class file major version` | Wrong JDK — use JDK 17 |
| `Permission denied: ./gradlew` | `chmod +x gradlew` |
| Blank white screen | The `rifq.appUrl` host is unreachable; check the URL and that it serves HTTPS |
| No notifications | Notification permission denied, or the channel is muted in system settings |
| Reminders late | Allow "Alarms & reminders" and exempt the app from battery optimisation |
| `apksigner: command not found` | Use `$ANDROID_HOME/build-tools/35.0.0/apksigner` |

---

## 10. Regenerating brand icons

The launcher PNGs are produced from the same emerald/gold geometry as the vector
icon:

```bash
bash scripts/generate-android-icons.sh    # requires ImageMagick
```

To change the logo, edit `res/drawable/ic_launcher_foreground.xml` (adaptive
icon) and the matching shapes in the script (legacy PNGs), then rerun it.
