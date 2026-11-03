package com.sendtally.nativetimer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NativeTimerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NativeTimer")

    Function("sync") { json: String? ->
      appContext.reactContext?.let { NativeTimerService.sync(it, json) }
    }

    Function("areActivitiesEnabled") { true }
  }
}
