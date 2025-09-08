import 'dart:async';

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'storage_service.dart';
import 'env_service.dart';

class DevicePresenceService {
  DevicePresenceService._internal();
  static final DevicePresenceService instance = DevicePresenceService._internal();

  DatabaseReference? _ref;
  String? _deviceId;
  Timer? _heartbeat;
  Duration _interval = const Duration(seconds: 60);

  Future<void> start({required String currentScreen, double? latitude, double? longitude, Duration? heartbeatInterval}) async {
    try {
      _deviceId ??= await StorageService.getOrCreateDeviceId();
      final deviceId = _deviceId!;
      _ref = FirebaseDatabase.instance.ref(FirebasePaths.p('DEVICES')).child(deviceId);
      final now = DateTime.now().toIso8601String();
      String? appName;
      String? appPackage;
      String? appVersion;
      String? appBuildNumber;
      try {
        final info = await PackageInfo.fromPlatform();
        appName = info.appName;
        appPackage = info.packageName;
        appVersion = info.version;
        appBuildNumber = info.buildNumber;
      } catch (_) {}
      final body = <String, dynamic>{
        'DEVICE_ID': deviceId,
        'CURRENT_SCREEN': currentScreen,
        'ONLINE': true,
        'UPDATED_AT': now,
        'APP_ENV': Env.appEnv.toUpperCase(),
      };
      if (latitude != null) body['LATITUDE'] = latitude;
      if (longitude != null) body['LONGITUDE'] = longitude;
      if (appName != null) body['APP_NAME'] = appName;
      if (appPackage != null) body['APP_PACKAGE'] = appPackage;
      if (appVersion != null) body['APP_VERSION'] = appVersion;
      if (appBuildNumber != null) body['APP_BUILD_NUMBER'] = appBuildNumber;

      try { await _ref!.onDisconnect().remove(); } catch (_) {}

      await _ref!.set(body);
      debugPrint('[DevicePresence] start: device=$deviceId screen=$currentScreen');

      _interval = heartbeatInterval ?? _interval;
      _heartbeat?.cancel();
      _heartbeat = Timer.periodic(_interval, (_) async {
        try {
          await _ref!.update({
            'UPDATED_AT': DateTime.now().toIso8601String(),
            'ONLINE': true,
          });
        } catch (_) {}
      });
    } catch (e) {
      debugPrint('[DevicePresence] start error: $e');
    }
  }

  Future<void> updateScreen(String currentScreen) async {
    if (_ref == null) return;
    try {
      final now = DateTime.now().toIso8601String();
      await _ref!.update({
        'CURRENT_SCREEN': currentScreen,
        'UPDATED_AT': now,
      });
      debugPrint('[DevicePresence] updateScreen: $currentScreen');
    } catch (e) {
      debugPrint('[DevicePresence] updateScreen error: $e');
    }
  }

  Future<void> updateLocation({double? latitude, double? longitude}) async {
    if (_ref == null) return;
    try {
      final now = DateTime.now().toIso8601String();
      final updates = <String, dynamic>{
        'UPDATED_AT': now,
      };
      if (latitude != null) updates['LATITUDE'] = latitude;
      if (longitude != null) updates['LONGITUDE'] = longitude;
      await _ref!.update(updates);
    } catch (e) {
      debugPrint('[DevicePresence] updateLocation error: $e');
    }
  }

  Future<void> updateDisplaying({
    required bool displaying,
    String? contentType,
    String? contentId,
  }) async {
    if (_ref == null) return;
    try {
      final now = DateTime.now().toIso8601String();
      final updates = <String, dynamic>{
        'UPDATED_AT': now,
        'IS_DISPLAYING': displaying,
      };
      if (contentType != null) updates['CONTENT_TYPE'] = contentType.toUpperCase();
      if (contentId != null) updates['CONTENT_ID'] = contentId;
      await _ref!.update(updates);
      debugPrint('[DevicePresence] updateDisplaying: displaying=$displaying type=$contentType id=$contentId');
    } catch (e) {
      debugPrint('[DevicePresence] updateDisplaying error: $e');
    }
  }

  Future<void> stop() async {
    try {
      final r = _ref;
      _ref = null;
      _heartbeat?.cancel();
      _heartbeat = null;
      if (r != null) {
        try { await r.onDisconnect().cancel(); } catch (_) {}
        await r.remove();
      }
      debugPrint('[DevicePresence] stop: removed device presence');
    } catch (e) {
      debugPrint('[DevicePresence] stop error: $e');
    }
  }
}
