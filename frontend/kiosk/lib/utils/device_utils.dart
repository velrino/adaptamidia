import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:device_info_plus/device_info_plus.dart';

class DeviceUtils {
  static DeviceUtils? _instance;
  static DeviceUtils get instance => _instance ??= DeviceUtils._internal();
  
  DeviceUtils._internal();

  String? _deviceId;

  /// Generate unique device ID based on device info + timestamp
  Future<String> getDeviceId() async {
    if (_deviceId != null) return _deviceId!;

    final deviceInfo = DeviceInfoPlugin();
    String deviceIdentifier;

    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      deviceIdentifier = '${androidInfo.brand}-${androidInfo.model}-${androidInfo.id}';
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      deviceIdentifier = '${iosInfo.name}-${iosInfo.model}-${iosInfo.identifierForVendor}';
    } else {
      deviceIdentifier = 'unknown-device';
    }

    // Add timestamp for uniqueness across multiple auth requests
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final uniqueString = '$deviceIdentifier-$timestamp';
    
    // Generate hash for consistent length and security
    final bytes = utf8.encode(uniqueString);
    final digest = sha256.convert(bytes);
    
    _deviceId = digest.toString().substring(0, 16); // Use first 16 chars
    return _deviceId!;
  }

  /// Reset device ID (for new auth requests)
  void resetDeviceId() {
    _deviceId = null;
  }

  /// Generate new device ID for each auth attempt
  Future<String> generateNewDeviceId() async {
    resetDeviceId();
    return await getDeviceId();
  }
}