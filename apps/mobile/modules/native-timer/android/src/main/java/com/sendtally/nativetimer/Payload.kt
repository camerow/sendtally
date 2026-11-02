package com.sendtally.nativetimer

import org.json.JSONArray
import org.json.JSONObject

/** What JavaScript hands over: the run's upcoming steps with absolute times in milliseconds. */
data class Payload(
  val runId: String,
  val title: String,
  val muted: Boolean,
  val steps: List<Step>,
  val pausedLeftS: Int?,
  val pausedText: String,
  val nextText: String,
  val channelName: String,
) {
  data class Cue(val at: Long, val sound: String)

  data class Step(
    val look: String,
    val label: String,
    val hint: String?,
    val next: String?,
    val setLine: String,
    val startsAt: Long,
    val endsAt: Long?,
    val runShare: Double,
    val cues: List<Cue>,
  )

  /** The step on at `now`: the last one already started, never past one that waits. */
  fun current(now: Long): Int {
    var index = 0
    for ((i, step) in steps.withIndex()) {
      if (step.startsAt > now) break
      index = i
      if (step.endsAt == null) break
    }
    return index
  }

  companion object {
    fun parse(json: String): Payload {
      val o = JSONObject(json)
      return Payload(
        runId = o.getString("runId"),
        title = o.getString("title"),
        muted = o.getBoolean("muted"),
        steps = o.getJSONArray("steps").objects().map { s ->
          Step(
            look = s.getString("look"),
            label = s.getString("label"),
            hint = s.optStringOrNull("hint"),
            next = s.optStringOrNull("next"),
            setLine = s.getString("setLine"),
            startsAt = s.getLong("startsAt"),
            endsAt = if (s.isNull("endsAt")) null else s.getLong("endsAt"),
            runShare = s.getDouble("runShare"),
            cues = s.getJSONArray("cues").objects().map { Cue(it.getLong("at"), it.getString("sound")) },
          )
        },
        pausedLeftS = if (o.isNull("pausedLeftS")) null else o.getInt("pausedLeftS"),
        pausedText = o.getString("pausedText"),
        nextText = o.getString("nextText"),
        channelName = o.optString("channelName", o.getString("title")),
      )
    }

    private fun JSONArray.objects(): List<JSONObject> = (0 until length()).map { getJSONObject(it) }

    private fun JSONObject.optStringOrNull(key: String): String? = if (isNull(key)) null else getString(key)
  }
}
