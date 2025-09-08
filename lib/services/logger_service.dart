import 'dart:developer' as developer;

enum LogLevel { debug, info, warning, error, critical }

class LoggerService {
  static bool _isDebugMode = true;
  static String _appName = 'SeeMedIA';

  static void setDebugMode(bool isDebug) {
    _isDebugMode = isDebug;
  }

  static void setAppName(String name) {
    _appName = name;
  }

  static void debug(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      LogLevel.debug,
      message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
    );
  }

  static void info(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      LogLevel.info,
      message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
    );
  }

  static void warning(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      LogLevel.warning,
      message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
    );
  }

  static void error(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      LogLevel.error,
      message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
    );
  }

  static void critical(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      LogLevel.critical,
      message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
    );
  }

  static void apiRequest(
    String method,
    String endpoint, {
    Map<String, dynamic>? data,
  }) {
    if (_isDebugMode) {
      final message = 'API Request: $method $endpoint';
      final details = data != null ? 'Data: $data' : 'No data';
      debug('$message\n$details', tag: 'API');
    }
  }

  static void apiResponse(
    String endpoint,
    int statusCode, {
    dynamic response,
    String? error,
  }) {
    if (_isDebugMode) {
      final message = 'API Response: $endpoint - Status: $statusCode';
      if (error != null) {
        LoggerService.error('$message - Error: $error', tag: 'API');
      } else {
        debug('$message\nResponse: $response', tag: 'API');
      }
    }
  }

  static void apiError(
    String endpoint,
    Object error, {
    StackTrace? stackTrace,
  }) {
    LoggerService.error(
      'API Error: $endpoint',
      tag: 'API',
      error: error,
      stackTrace: stackTrace,
    );
  }

  static void _log(
    LogLevel level,
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    if (!_isDebugMode && level == LogLevel.debug) {
      return;
    }

    final timestamp = DateTime.now().toIso8601String();
    final tagStr = tag != null ? '[$tag]' : '';
    final levelStr = level.name.toUpperCase();
    final fullMessage = '$timestamp [$_appName] $tagStr [$levelStr] $message';

    switch (level) {
      case LogLevel.debug:
        developer.log(
          fullMessage,
          name: _appName,
          level: 500,
          error: error,
          stackTrace: stackTrace,
        );
        break;
      case LogLevel.info:
        developer.log(
          fullMessage,
          name: _appName,
          level: 800,
          error: error,
          stackTrace: stackTrace,
        );
        break;
      case LogLevel.warning:
        developer.log(
          fullMessage,
          name: _appName,
          level: 900,
          error: error,
          stackTrace: stackTrace,
        );
        break;
      case LogLevel.error:
      case LogLevel.critical:
        developer.log(
          fullMessage,
          name: _appName,
          level: 1000,
          error: error,
          stackTrace: stackTrace,
        );
        break;
    }
  }
}
