/**
 * Static workout video asset map.
 * All 22 categories are statically required here so Metro bundler
 * includes them in the APK bundle. Dynamic require() is not supported
 * by the React Native bundler, so every asset must be declared upfront.
 *
 * Keys must exactly match the exercise names returned by the AI
 * (see WORKOUT_EXERCISE_NAMES in this file, mirrored in server-apex).
 */

export const WORKOUT_ASSETS: Record<string, any> = {
  'barbell biceps curl': require('../assets/workouts/barbell_biceps_curl.mp4'),
  'bench press':         require('../assets/workouts/bench_press.mp4'),
  'chest fly machine':   require('../assets/workouts/chest_fly_machine.mp4'),
  'deadlift':            require('../assets/workouts/deadlift.mp4'),
  'decline bench press': require('../assets/workouts/decline_bench_press.mp4'),
  'hammer curl':         require('../assets/workouts/hammer_curl.mp4'),
  'hip thrust':          require('../assets/workouts/hip_thrust.mp4'),
  'incline bench press': require('../assets/workouts/incline_bench_press.mp4'),
  'lat pulldown':        require('../assets/workouts/lat_pulldown.mp4'),
  'lateral raise':       require('../assets/workouts/lateral_raise.mp4'),
  'leg extension':       require('../assets/workouts/leg_extension.mp4'),
  'leg raises':          require('../assets/workouts/leg_raises.mp4'),
  'plank':               require('../assets/workouts/plank.mp4'),
  'pull up':             require('../assets/workouts/pull_up.mp4'),
  'push-up':             require('../assets/workouts/push_up.mp4'),
  'romanian deadlift':   require('../assets/workouts/romanian_deadlift.mp4'),
  'russian twist':       require('../assets/workouts/russian_twist.mp4'),
  'shoulder press':      require('../assets/workouts/shoulder_press.mp4'),
  'squat':               require('../assets/workouts/squat.mp4'),
  't bar row':           require('../assets/workouts/t_bar_row.mp4'),
  'tricep pushdown':     require('../assets/workouts/tricep_pushdown.mp4'),
  'tricep dips':         require('../assets/workouts/tricep_dips.mp4'),
};

/**
 * The canonical list of exercise names sent to the AI prompt.
 * The AI must only suggest from this list.
 */
export const WORKOUT_EXERCISE_NAMES = Object.keys(WORKOUT_ASSETS);
