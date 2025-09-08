import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';

import 'api_service.dart';
import 'storage_service.dart';
import 'package:firebase_database/firebase_database.dart';
import 'env_service.dart';

class AppUpdateService {
  AppUpdateService._internal();
  static final AppUpdateService instance = AppUpdateService._internal();

  static const MethodChannel _ch = MethodChannel('com.seemidia/app_update');
  StreamSubscription<DatabaseEvent>? _releaseSub;
  int? _lastSeenReleaseVersion;

  Future<void> checkAndUpdateIfNeeded() async {
    final token = await StorageService.getAuthToken();
    if (token == null || token.isEmpty) return;

    final pkg = await PackageInfo.fromPlatform();
    final currentCode = int.tryParse(pkg.buildNumber) ?? 0;

    final res = await ApiService.get<Map<String, dynamic>>(
      '/device/app/latest',
      (m) => m,
      headers: {if (token.isNotEmpty) 'Authorization': 'Bearer $token'},
    );
    if (!res.success || res.data == null) return;

    final data = res.data!;
    final serverCode = (data['version_code'] as num?)?.toInt() ?? 0;
    final apkUrl = (data['apk_url'] as String?) ?? '';
    final expectedSha256 = data['sha256'] as String?; // optional
    final serverProvidedEtag =
        data['etag'] as String?; // optional (informational)
    if (apkUrl.isEmpty) return;

    if (serverCode <= currentCode) return; // up-to-date

    // Avoid re-download if ETag unchanged
    final prefs = await SharedPreferences.getInstance();
    final lastEtag = prefs.getString('last_apk_etag');
    final uri = Uri.parse(apkUrl);
    final headers = <String, String>{
      if (lastEtag != null && lastEtag.isNotEmpty) 'If-None-Match': lastEtag,
    };
    final resp = await http.get(uri, headers: headers);
    if (resp.statusCode == 304) return; // not modified
    if (resp.statusCode != 200) return;

    // Save to temp file
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/update-app-release.apk');
    await file.writeAsBytes(resp.bodyBytes, flush: true);

    // Verify checksum if provided
    if (expectedSha256 != null && expectedSha256.isNotEmpty) {
      final ok = await _verifySha256(file, expectedSha256);
      if (!ok) {
        try {
          await file.delete();
        } catch (_) {}
        return;
      }
    }

    // Attempt install (may require user confirmation unless device owner)
    await _ch.invokeMethod('installApk', {'path': file.path});

    final newEtag = resp.headers['etag'] ?? serverProvidedEtag;
    if (newEtag != null && newEtag.isNotEmpty) {
      await prefs.setString('last_apk_etag', newEtag);
    }
  }

  /// Alternative source: reads release info from RTDB at `RELEASE`.
  /// Expected schema:
  /// {
  ///   "version_code": 42,
  ///   "version_name": "1.2.3",
  ///   "apk_url": "https://storage.googleapis.com/adapta-midia/device/app-release.apk",
  ///   "etag": "<optional-etag>",
  ///   "sha256": "<optional-sha256-hex>",
  ///   "min_version_code": 40 // optional (force update gate)
  /// }
  Future<void> checkAndUpdateFromFirebase() async {
    try {
      final snap = await FirebaseDatabase.instance
          .ref(FirebasePaths.p('RELEASE'))
          .get();
      if (!snap.exists) return;
      final data = Map<String, dynamic>.from(snap.value as Map);

      final pkg = await PackageInfo.fromPlatform();
      final currentCode = int.tryParse(pkg.buildNumber) ?? 0;

      final serverCode = (data['version_code'] as num?)?.toInt() ?? 0;
      final apkUrl = (data['apk_url'] as String?) ?? '';
      final expectedSha256 = data['sha256'] as String?;
      final serverProvidedEtag = data['etag'] as String?;
      // Optional: respect min_version_code (e.g., for forcing update)
      final minCode = (data['min_version_code'] as num?)?.toInt() ?? 0;

      if (apkUrl.isEmpty) return;
      if (serverCode <= currentCode && currentCode >= minCode) return;

      // Avoid re-download if ETag unchanged
      final prefs = await SharedPreferences.getInstance();
      final lastEtag = prefs.getString('last_apk_etag');
      final uri = Uri.parse(apkUrl);
      final headers = <String, String>{
        if (lastEtag != null && lastEtag.isNotEmpty) 'If-None-Match': lastEtag,
      };
      final resp = await http.get(uri, headers: headers);
      if (resp.statusCode == 304) return; // not modified
      if (resp.statusCode != 200) return;

      // Save to temp file
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/update-app-release.apk');
      await file.writeAsBytes(resp.bodyBytes, flush: true);

      // Verify checksum if provided
      if (expectedSha256 != null && expectedSha256.isNotEmpty) {
        final ok = await _verifySha256(file, expectedSha256);
        if (!ok) {
          try {
            await file.delete();
          } catch (_) {}
          return;
        }
      }

      await _ch.invokeMethod('installApk', {'path': file.path});

      final newEtag = resp.headers['etag'] ?? serverProvidedEtag;
      if (newEtag != null && newEtag.isNotEmpty) {
        await prefs.setString('last_apk_etag', newEtag);
      }
    } catch (_) {
      // silent fail — will retry on next schedule
    }
  }

  /// Listens to RTDB `RELEASE` node and triggers a check when version_code changes.
  void startFirebaseReleaseListener() {
    _releaseSub?.cancel();
    final ref = FirebaseDatabase.instance.ref(FirebasePaths.p('RELEASE'));
    _releaseSub = ref.onValue.listen((event) {
      try {
        final val = event.snapshot.value;
        if (val is Map) {
          final data = Map<String, dynamic>.from(val as Map);
          final vc = (data['version_code'] as num?)?.toInt();
          if (vc != null && vc != _lastSeenReleaseVersion) {
            _lastSeenReleaseVersion = vc;
            // Fire and forget; check routine handles all guards
            unawaited(checkAndUpdateFromFirebase());
          }
        }
      } catch (_) {}
    });
  }

  void stopFirebaseReleaseListener() {
    _releaseSub?.cancel();
    _releaseSub = null;
  }

  Future<bool> _verifySha256(File file, String expected) async {
    try {
      final bytes = await file.readAsBytes();
      final digest = sha256.convert(bytes).toString();
      return digest.toLowerCase() == expected.toLowerCase();
    } catch (_) {
      return false;
    }
  }
}
