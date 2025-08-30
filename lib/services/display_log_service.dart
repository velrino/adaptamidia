import 'package:firebase_database/firebase_database.dart';

class DisplayLogService {
  static final DisplayLogService _instance = DisplayLogService._internal();
  static DisplayLogService get instance => _instance;
  DisplayLogService._internal();

  DatabaseReference get _logsRef => FirebaseDatabase.instance.ref('DISPLAY_LOGS');

  Future<void> createLog({required String identifier, required Map<String, dynamic> body}) async {
    try {
      await _logsRef.child(identifier).set(body);
    } catch (_) {
      // fail silently; avoids breaking playback
    }
  }
}

