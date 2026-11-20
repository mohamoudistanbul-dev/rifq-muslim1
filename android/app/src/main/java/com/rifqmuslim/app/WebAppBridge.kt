package com.rifqmuslim.app

import android.webkit.JavascriptInterface

/**
 * JavaScript bridge exposed to the RIFQ Muslim client as `window.RifqNative`.
 * Only documented, non-sensitive operations are exposed; no user data is read.
 */
class WebAppBridge(private val activity: MainActivity) {

    @JavascriptInterface
    fun hasNotificationPermission(): Boolean = activity.hasNotificationPermission()

    @JavascriptInterface
    fun requestNotificationPermission() {
        activity.runOnUiThread { activity.requestNotificationPermission() }
    }

    @JavascriptInterface
    fun notify(title: String, body: String, tag: String) {
        PrayerNotifications.notifyNow(activity, title, body, tag)
    }

    /** Schedule a real Android alarm for an Athan reminder. */
    @JavascriptInterface
    fun schedulePrayer(id: String, triggerAtMillis: Long, title: String, body: String) {
        PrayerNotifications.schedule(activity, id, triggerAtMillis, title, body)
    }

    @JavascriptInterface
    fun cancelPrayer(id: String) {
        PrayerNotifications.cancel(activity, id)
    }

    @JavascriptInterface
    fun appVersion(): String = BuildConfig.VERSION_NAME

    @JavascriptInterface
    fun isNativeApp(): Boolean = true
}
