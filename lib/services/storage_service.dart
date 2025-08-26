import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/device_config.dart';

class StorageService {
  static const String _deviceConfigKey = 'device_config';
  static const String _themeKey = 'theme_mode';
  static const String _isConfiguredKey = 'is_configured';

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

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}