class Env {
  // Pass at build time: --dart-define=APP_ENV=RELEASE or DEVELOP
  static const String appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'UNKNOWN');
  static bool get isRelease => appEnv.toUpperCase() == 'RELEASE';
  static bool get isDevelop => appEnv.toUpperCase() == 'DEVELOP';

  static void validateOrThrow() {
    final v = appEnv.toUpperCase();
    if (v != 'RELEASE' && v != 'DEVELOP') {
      throw StateError('APP_ENV not set or invalid. Use --dart-define=APP_ENV=RELEASE|DEVELOP');
    }
  }
}

class FirebasePaths {
  static String p(String base) {
    // Prefix all RTDB roots in DEVELOP to avoid mixing with production data
    if (Env.isRelease) return base;
    return 'DEV_${base.toUpperCase()}';
  }
}
