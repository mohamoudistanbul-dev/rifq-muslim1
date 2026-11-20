package com.rifqmuslim.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Fires the actual Android notification when a prayer alarm triggers. */
class PrayerAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val appContext = context.applicationContext
        val id = intent.getStringExtra(PrayerNotifications.EXTRA_ID).orEmpty()
        val title = intent.getStringExtra(PrayerNotifications.EXTRA_TITLE).orEmpty()
        val body = intent.getStringExtra(PrayerNotifications.EXTRA_BODY).orEmpty()
        PrayerNotifications.notifyNow(appContext, title, body, id)
        PrayerNotifications.forget(appContext, id)
    }
}
