import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'env_service.dart';

class DisplayLogService {
  static final DisplayLogService _instance = DisplayLogService._internal();
  static DisplayLogService get instance => _instance;
  DisplayLogService._internal();

  DatabaseReference get _logsRef => FirebaseDatabase.instance.ref(FirebasePaths.p('DISPLAY_LOGS'));

  Future<void> createLog({required String identifier, required Map<String, dynamic> body}) async {
    try {
      debugPrint('[DisplayLogService] Writing log: id=$identifier, path=DISPLAY_LOGS/$identifier');
      await _logsRef.child(identifier).set(body);
      debugPrint('[DisplayLogService] Write success: id=$identifier');
    } catch (e, st) {
      if (e is FirebaseException) {
        debugPrint('[DisplayLogService] Write failed: id=$identifier code=${e.code} message=${e.message}');
      } else {
        debugPrint('[DisplayLogService] Write failed: id=$identifier error=$e');
      }
      debugPrint('[DisplayLogService] Stack: $st');
      // fail silently; avoids breaking playback
    }
  }
}
