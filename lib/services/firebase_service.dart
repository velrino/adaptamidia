import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import '../interfaces/firebase_auth_data.dart';

class FirebaseService {
  static FirebaseService? _instance;
  static FirebaseService get instance => _instance ??= FirebaseService._internal();
  
  FirebaseService._internal();

  late FirebaseDatabase _database;
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    await Firebase.initializeApp();

    _database = FirebaseDatabase.instance;
    _initialized = true;
  }

  /// Listen for auth device data once and remove after reading
  Future<FirebaseAuthData?> listenForAuthDevice(String deviceId) async {
    if (!_initialized) await initialize();
    
    final ref = _database.ref('AUTH_DEVICES/$deviceId');
    
    // Listen once for the data
    final snapshot = await ref.once();
    
    if (snapshot.snapshot.exists) {
      final data = Map<String, dynamic>.from(snapshot.snapshot.value as Map);
      
      // Remove the data after reading (websocket-like behavior)
      await ref.remove();
      
      return FirebaseAuthResponse.fromJson(data);
    }
    
    return null;
  }

  /// Set up a one-time listener for auth device
  void listenOnceForAuthDevice(
    String deviceId,
    Function(FirebaseAuthData) onSuccess,
    Function(String) onError,
  ) {
    if (!_initialized) {
      initialize().then((_) => _listenOnceForAuthDevice(deviceId, onSuccess, onError));
    } else {
      _listenOnceForAuthDevice(deviceId, onSuccess, onError);
    }
  }

  void _listenOnceForAuthDevice(
    String deviceId,
    Function(FirebaseAuthData) onSuccess,
    Function(String) onError,
  ) {
    final ref = _database.ref('AUTH_DEVICES/$deviceId');
    
    ref.onValue.listen(
      (event) {
        if (event.snapshot.exists) {
          try {
            final data = Map<String, dynamic>.from(event.snapshot.value as Map);
            final authData = FirebaseAuthResponse.fromJson(data);
            
            // Remove the data after reading
            ref.remove().then((_) {
              onSuccess(authData);
            }).catchError((error) {
              onSuccess(authData); // Still call success even if remove fails
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