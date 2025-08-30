import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../interfaces/auth_data.dart';

class FirebaseService {
  static FirebaseService? _instance;
  static FirebaseService get instance =>
      _instance ??= FirebaseService._internal();

  FirebaseService._internal();

  late FirebaseDatabase _database;
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    await Firebase.initializeApp();
    final opts = Firebase.app().options;
    debugPrint(
      '[FirebaseService] Firebase initialized projectId=${opts.projectId} appId=${opts.appId} databaseURL=${opts.databaseURL ?? 'null'}',
    );

    // Ensure anonymous auth early so Storage/RTDB rules with auth work
    try {
      final auth = FirebaseAuth.instance;
      if (auth.currentUser == null) {
        final cred = await auth.signInAnonymously();
        debugPrint('[FirebaseService] Signed in anonymously uid=${cred.user?.uid}');
      } else {
        debugPrint('[FirebaseService] Already signed in uid=${auth.currentUser?.uid}');
      }
    } catch (e) {
      debugPrint('[FirebaseService] Anonymous sign-in failed: $e');
    }

    // Ensure anonymous auth for Storage and RTDB rules
    try {
      final auth = FirebaseAuth.instance;
      if (auth.currentUser == null) {
        final cred = await auth.signInAnonymously();
        debugPrint('[FirebaseService] Signed in anonymously uid=${cred.user?.uid}');
      } else {
        debugPrint('[FirebaseService] Already signed in uid=${auth.currentUser?.uid}');
      }
    } catch (e) {
      debugPrint('[FirebaseService] Anonymous sign-in failed: $e');
    }

    _database = FirebaseDatabase.instance;
    // Enable offline disk persistence for Realtime Database (mobile only)
    try {
      _database.setPersistenceEnabled(true);
      // Set cache size within Firebase limit (<= 100MB). Use 20MB by default.
      const cacheSizeBytes = 20 * 1024 * 1024; // 20 MB
      _database.setPersistenceCacheSizeBytes(cacheSizeBytes);
    } catch (e) {
      debugPrint('[FirebaseService] Persistence setup failed: $e');
      // Ignore if not supported on this platform
    }
    _initialized = true;
    debugPrint(
      '[FirebaseService] Realtime Database ready (persistence enabled)',
    );
  }

  /// Listen for auth device data once and remove after reading
  Future<IAuthResponse?> listenForAuthDevice(String deviceId) async {
    if (!_initialized) await initialize();

    final ref = _database.ref('AUTH_DEVICES/$deviceId');

    // Listen once for the data
    final snapshot = await ref.once();

    if (snapshot.snapshot.exists) {
      final data = Map<String, dynamic>.from(snapshot.snapshot.value as Map);

      // Remove the data after reading (websocket-like behavior)
      await ref.remove();

      return IAuthResponse.fromJson(data);
    }

    return null;
  }

  /// Set up a one-time listener for auth device
  void listenOnceForAuthDevice(
    String deviceId,
    Function(IAuthResponse) onSuccess,
    Function(String) onError,
  ) {
    if (!_initialized) {
      initialize().then(
        (_) => _listenOnceForAuthDevice(deviceId, onSuccess, onError),
      );
    } else {
      _listenOnceForAuthDevice(deviceId, onSuccess, onError);
    }
  }

  void _listenOnceForAuthDevice(
    String deviceId,
    Function(IAuthResponse) onSuccess,
    Function(String) onError,
  ) {
    final ref = _database.ref('AUTH_DEVICES/$deviceId');

    ref.onValue.listen(
      (event) {
        if (event.snapshot.exists) {
          try {
            final data = Map<String, dynamic>.from(event.snapshot.value as Map);
            final authData = IAuthResponse.fromJson(data);

            // Remove the data after reading
            ref
                .remove()
                .then((_) {
                  onSuccess(authData);
                })
                .catchError((error) {
                  onSuccess(
                    authData,
                  ); // Still call success even if remove fails
                });
          } catch (e) {
            onError('Error parsing auth data: $e');
          }
        }
      },
      onError: (error) {
        // Don't treat permission denied as an error - it's expected when node doesn't exist yet
        if (error.toString().contains('Permission denied')) {
          // Just continue listening, this is normal
          return;
        }
        onError('Firebase listener error: $error');
      },
    );
  }
}
