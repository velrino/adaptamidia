import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';

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
  Future<Map<String, dynamic>?> listenForAuthDevice(String deviceId) async {
    if (!_initialized) await initialize();
    
    final ref = _database.ref('AUTH_DEVICES/$deviceId');
    
    // Listen once for the data
    final snapshot = await ref.once();
    
    if (snapshot.snapshot.exists) {
      final data = Map<String, dynamic>.from(snapshot.snapshot.value as Map);
      
      // Remove the data after reading (websocket-like behavior)
      await ref.remove();
      
      return data;
    }
    
    return null;
  }

  /// Set up a one-time listener for auth device
  void listenOnceForAuthDevice(
    String deviceId,
    Function(Map<String, dynamic>) onSuccess,
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
    Function(Map<String, dynamic>) onSuccess,
    Function(String) onError,
  ) {
    final ref = _database.ref('AUTH_DEVICES/$deviceId');
    
    ref.onValue.listen(
      (event) {
        if (event.snapshot.exists) {
          try {
            final data = Map<String, dynamic>.from(event.snapshot.value as Map);
            
            // Remove the data after reading
            ref.remove().then((_) {
              onSuccess(data);
            }).catchError((error) {
              onSuccess(data); // Still call success even if remove fails
            });
            
          } catch (e) {
            onError('Error parsing auth data: $e');
          }
        }
      },
      onError: (error) {
        onError('Firebase listener error: $error');
      },
    );
  }
}