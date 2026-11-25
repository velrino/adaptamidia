import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';
import 'dart:math';
import '../models/device_config.dart';

class StorageService {
  static const String _deviceConfigKey = 'device_config';
  static const String _themeKey = 'theme_mode';
  static const String _isConfiguredKey = 'is_configured';
  static const String _authTokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';
  static const String _deviceIdKey = 'device_id';

  static Future<void> saveDeviceConfig(DeviceConfig config) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_deviceConfigKey, jsonEncode(config.toJson()));
    await prefs.setBool(_isConfiguredKey, true);
  }

  static Future<DeviceConfig?> getDeviceConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final configString = prefs.getString(_deviceConfigKey);
    if (configString != null) {
      return DeviceConfig.fromJson(jsonDecode(configString));
    }
    return null;
  }

  static Future<bool> isDeviceConfigured() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isConfiguredKey) ?? false;
  }

  static Future<void> saveThemeMode(String themeMode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, themeMode);
  }

  static Future<String> getThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_themeKey) ?? 'system';
  }

  // Auth methods
  static Future<void> saveAuthToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_authTokenKey, token);
  }

  static Future<String?> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_authTokenKey);
  }

  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userDataKey, jsonEncode(userData));
  }

  static Future<Map<String, dynamic>?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final userDataString = prefs.getString(_userDataKey);
    if (userDataString != null) {
      return jsonDecode(userDataString);
    }
    return null;
  }

  static Future<bool> isLoggedIn() async {
    final token = await getAuthToken();
    return token != null && token.isNotEmpty;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_authTokenKey);
    await prefs.remove(_userDataKey);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  // Persistent device ID (stable across restarts)
  static Future<String> getOrCreateDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_deviceIdKey);
    if (existing != null && existing.isNotEmpty) return existing;

    // Generate a random-based ID and hash for consistent length
    final rnd = Random();
    final randBytes = List<int>.generate(32, (_) => rnd.nextInt(256));
    final seed = '${DateTime.now().microsecondsSinceEpoch}-${base64Url.encode(randBytes)}';
    final digest = sha256.convert(utf8.encode(seed)).toString();
    final deviceId = digest.substring(0, 16);
    await prefs.setString(_deviceIdKey, deviceId);
    return deviceId;
  }
}
