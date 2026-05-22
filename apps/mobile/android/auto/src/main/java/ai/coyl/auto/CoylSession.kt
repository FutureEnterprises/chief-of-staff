package ai.coyl.auto

import android.content.Intent
import android.content.res.Configuration
import androidx.car.app.Screen
import androidx.car.app.Session

/**
 * Single Session for a car-projection connection.
 *
 * The Session lifecycle:
 *   - `onCreateScreen(intent)` is called exactly once when the car
 *     connects and asks for the root screen to render.
 *   - `onNewIntent(intent)` is called if the user re-launches COYL
 *     from the car launcher while already projecting; we can pop to
 *     the root screen here if we ever push deeper, but for v0.1 we
 *     stay on a single screen so this is a no-op.
 *   - `onCarConfigurationChanged(...)` fires when the car's
 *     configuration (day/night, screen size, locale) flips. We rely
 *     on the framework's automatic re-invalidation of the Screen, so
 *     this is also a no-op for now.
 *
 * Keeping the Session this thin is intentional: behavior lives in
 * CoylScreen so the screen can be unit-tested in isolation against
 * the androidx.car.app.testing harness.
 */
class CoylSession : Session() {

    override fun onCreateScreen(intent: Intent): Screen {
        return CoylScreen(carContext)
    }

    override fun onNewIntent(intent: Intent) {
        // v0.1: single-screen surface, nothing to do on relaunch.
        // When we add deeper navigation (e.g. recent danger windows
        // list) we'll pop to root here via screenManager.popToRoot().
    }

    override fun onCarConfigurationChanged(newConfiguration: Configuration) {
        // PaneTemplate re-renders automatically when the Screen is
        // invalidated. We let the framework handle day/night flips.
    }
}
