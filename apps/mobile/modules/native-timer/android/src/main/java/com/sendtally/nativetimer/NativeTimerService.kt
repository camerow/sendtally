package com.sendtally.nativetimer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.media.AudioAttributes
import android.media.SoundPool
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat

/**
 * Owns the run's schedule once JavaScript hands it over: keeps the notification on the current
 * step and plays each cue on time while the app is in the background, or gone.
 */
class NativeTimerService : Service() {
  companion object {
    private const val CHANNEL = "timer"
    private const val ID = 4207
    private const val PREFS = "native-timer"
    private const val LATE_MS = 500L
    private const val SOUNDS = "tick work rest finish"

    private var last: String? = null

    fun sync(context: Context, json: String?) {
      if (json == last) return
      last = json
      val app = context.applicationContext
      app.getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("payload", json).apply()
      if (json == null) {
        app.stopService(Intent(app, NativeTimerService::class.java))
        NotificationManagerCompat.from(app).cancel(ID)
        return
      }
      val intent = Intent(app, NativeTimerService::class.java).putExtra("payload", json)
      try {
        app.startForegroundService(intent)
      } catch (e: IllegalStateException) {
        // Not allowed from the background; the next foreground sync starts it.
      }
    }
  }

  private val handler = Handler(Looper.getMainLooper())
  private var payload: Payload? = null
  private val fired = mutableSetOf<String>()
  private var sounds: SoundPool? = null
  private val soundIds = mutableMapOf<String, Int>()
  private var foreground = false

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    val pool = SoundPool.Builder()
      .setMaxStreams(2)
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
      .build()
    for (name in SOUNDS.split(" ")) {
      runCatching { assets.openFd("$name.wav").use { soundIds[name] = pool.load(it, 1) } }
    }
    sounds = pool
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val json = intent?.getStringExtra("payload")
      ?: getSharedPreferences(PREFS, MODE_PRIVATE).getString("payload", null)
    val next = json?.let { runCatching { Payload.parse(it) }.getOrNull() }
    if (next == null) {
      stop()
      return START_NOT_STICKY
    }
    if (next.runId != payload?.runId) fired.clear()
    payload = next
    ensureChannel(next.channelName)
    val notification = notification(next, System.currentTimeMillis())
    ServiceCompat.startForeground(
      this, ID, notification,
      if (Build.VERSION.SDK_INT >= 34) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
    )
    foreground = true
    step()
    return START_REDELIVER_INTENT
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    sounds?.release()
    sounds = null
    super.onDestroy()
  }

  private fun stop() {
    handler.removeCallbacksAndMessages(null)
    if (foreground) ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    foreground = false
    stopSelf()
  }

  /** Plays what is due, shows the step that is on, and waits for whatever comes next. */
  private fun step() {
    handler.removeCallbacksAndMessages(null)
    val p = payload ?: return
    val now = System.currentTimeMillis()
    val audible = !p.muted && p.pausedLeftS == null
    var ahead: Long? = null
    p.steps.forEachIndexed { i, s ->
      val end = s.endsAt
      if (end != null && end > now && i + 1 < p.steps.size) ahead = minOf(ahead ?: end, end)
      if (!audible) return@forEachIndexed
      for (cue in s.cues) {
        val key = "${cue.at}:${cue.sound}"
        if (key in fired) continue
        if (cue.at <= now + 15) {
          fired += key
          if (cue.at >= now - LATE_MS) play(cue.sound)
        } else {
          ahead = minOf(ahead ?: cue.at, cue.at)
        }
      }
    }
    NotificationManagerCompat.from(this).let {
      if (it.areNotificationsEnabled()) runCatching { it.notify(ID, notification(p, now)) }
    }
    val next = ahead
    if (next == null) {
      // Nothing left to count or play: the notification stays, the service goes.
      handler.postDelayed({
        if (foreground) ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH)
        foreground = false
        stopSelf()
      }, 1500)
      return
    }
    handler.postAtTime({ step() }, SystemClock.uptimeMillis() + (next - now).coerceAtLeast(0))
  }

  private fun play(sound: String) {
    val id = soundIds[sound] ?: return
    sounds?.play(id, 1f, 1f, 1, 0, 1f)
  }

  private fun ensureChannel(name: String) {
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL) != null) return
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL, name, NotificationManager.IMPORTANCE_LOW).apply {
        setSound(null, null)
        enableVibration(false)
        setShowBadge(false)
      }
    )
  }

  private fun notification(p: Payload, now: Long): Notification {
    val index = p.current(now)
    val step = p.steps.getOrNull(index)
    val next = p.steps.getOrNull(index + 1)
    val open = PendingIntent.getActivity(
      this, 0,
      Intent(Intent.ACTION_VIEW, Uri.parse("sendtally://live")).setPackage(packageName)
        .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    val builder = NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(smallIcon())
      .setColor(Color.parseColor("#403f4c"))
      .setSubText(p.title)
      .setContentIntent(open)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setRequestPromotedOngoing(true)
    if (step == null) return builder.build()
    val line = listOf(step.label, step.setLine).filter { it.isNotEmpty() }.joinToString(" · ")
    val end = step.endsAt
    when {
      step.look == "done" -> {
        builder.setContentTitle(listOfNotNull(step.label, step.hint).joinToString(" · "))
        builder.setShortCriticalText(step.label)
      }
      p.pausedLeftS != null -> {
        builder.setContentTitle("${p.pausedText} · ${clock(p.pausedLeftS)}")
        builder.setContentText(line)
        builder.setShortCriticalText(p.pausedText)
      }
      end == null -> {
        builder.setContentTitle(listOfNotNull(step.label, step.hint).joinToString(" · "))
        builder.setContentText(step.setLine)
        builder.setShortCriticalText(step.label)
      }
      else -> {
        builder.setContentTitle(line)
        next?.let { builder.setContentText("${p.nextText}: ${it.label}") }
        builder.setWhen(end).setShowWhen(true).setUsesChronometer(true)
          .setChronometerCountDown(true)
      }
    }
    val share = if (step.look == "done") 1.0 else step.runShare
    val color = when (step.look) {
      "work" -> Color.parseColor("#4A8FFC")
      "rest" -> Color.parseColor("#29AE70")
      else -> Color.parseColor("#9A97A8")
    }
    val max = 1000
    val progress = (share * max).toInt().coerceIn(0, max)
    if (Build.VERSION.SDK_INT >= 36) {
      builder.setStyle(
        NotificationCompat.ProgressStyle()
          .setProgressSegments(listOf(NotificationCompat.ProgressStyle.Segment(max).setColor(color)))
          .setProgressPoints(listOf(NotificationCompat.ProgressStyle.Point(progress).setColor(color)))
          .setProgress(progress)
          .setStyledByProgress(true)
      )
    } else {
      builder.setProgress(max, progress, false)
    }
    return builder.build()
  }

  private fun smallIcon(): Int {
    val id = resources.getIdentifier("notification_icon", "drawable", packageName)
    return if (id != 0) id else applicationInfo.icon
  }

  private fun clock(seconds: Int): String = "%d:%02d".format(seconds / 60, seconds % 60)
}
