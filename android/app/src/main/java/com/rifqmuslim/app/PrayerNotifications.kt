package com.rifqmuslim.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.content.getSystemService
import org.json.JSONObject

/**
 * Real Android notifications for RIFQ Muslim: one high-importance channel for
 * Athan and prayer reminders, plus exact alarms that survive app restarts,
 * reboots and timezone changes.
 */
object PrayerNotifications {

    const val CHANNEL_ID = "rifq_athan"
    const val EXTRA_ID = "rifq_extra_id"
    const val EXTRA_TITLE = "rifq_extra_title"
    const val EXTRA_BODY = "rifq_extra_body"

    private const val PREFS = "rifq_alarms"
    private const val NOTIFICATION_ID = 4001

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService<NotificationManager>() ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.athan_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = context.getString(R.string.athan_channel_description)
            enableVibration(true)
            setShowBadge(true)
        }
        manager.createNotificationChannel(channel)
    }

    fun canNotify(context: Context): Boolean {
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        }
        return true
    }

    @SuppressLint("MissingPermission")
    fun notifyNow(context: Context, title: String, body: String, tag: String) {
        if (!canNotify(context)) return
        ensureChannel(context)
        val openApp = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_rifq)
            .setColor(ContextCompat.getColor(context, R.color.rifq_emerald))
            .setContentTitle(title.ifBlank { context.getString(R.string.app_name) })
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(openApp)
            .build()
        NotificationManagerCompat.from(context)
            .notify(tag.ifBlank { "rifq-prayer" }, NOTIFICATION_ID, notification)
    }

    /** Schedules an Athan reminder and records it so it can be restored later. */
    fun schedule(context: Context, id: String, triggerAtMillis: Long, title: String, body: String) {
        if (id.isBlank() || triggerAtMillis <= System.currentTimeMillis()) return
        save(context, id, triggerAtMillis, title, body)
        setAlarm(context, id, triggerAtMillis, title, body)
    }

    fun cancel(context: Context, id: String) {
        if (id.isBlank()) return
        forget(context, id)
        val pending = PendingIntent.getBroadcast(
            context,
            id.hashCode(),
            Intent(context, PrayerAlarmReceiver::class.java),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pending != null) {
            context.getSystemService<AlarmManager>()?.cancel(pending)
            pending.cancel()
        }
    }

    /** Restores future reminders after a reboot, app update or timezone change. */
    fun rescheduleAll(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()
        for ((id, raw) in prefs.all) {
            val json = (raw as? String)?.let { runCatching { JSONObject(it) }.getOrNull() } ?: continue
            val at = json.optLong("at", 0L)
            if (at <= now) {
                prefs.edit().remove(id).apply()
                continue
            }
            setAlarm(context, id, at, json.optString("title"), json.optString("body"))
        }
    }

    fun forget(context: Context, id: String) {
        if (id.isBlank()) return
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(id).apply()
    }

    private fun setAlarm(
        context: Context,
        id: String,
        triggerAtMillis: Long,
        title: String,
        body: String
    ) {
        val manager = context.getSystemService<AlarmManager>() ?: return
        val intent = Intent(context, PrayerAlarmReceiver::class.java).apply {
            putExtra(EXTRA_ID, id)
            putExtra(EXTRA_TITLE, title)
            putExtra(EXTRA_BODY, body)
        }
        val pending = PendingIntent.getBroadcast(
            context,
            id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !manager.canScheduleExactAlarms() ->
                manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending)

            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
                manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending)

            else ->
                manager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending)
        }
    }

    private fun save(context: Context, id: String, at: Long, title: String, body: String) {
        val json = JSONObject().apply {
            put("at", at)
            put("title", title)
            put("body", body)
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(id, json.toString())
            .apply()
    }
}
