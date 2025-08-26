import '../models/device_auth.dart';
import '../services/api_service.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthApiService {
  static const String _authEndpoint = '/auth/device';
  static const String _baseUrl =
      'https://api.seemidia.com'; // Replace with your actual API base URL

  /// Simple generateAuth method that calls the API directly
  // static Future<Map<String, dynamic>?> generateAuth(String deviceId) async {
  //   try {
  //     final response = await http.post(
  //       Uri.parse('$_baseUrl$_authEndpoint/generate'),
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: jsonEncode({'id': deviceId}),
  //     );

  //     if (response.statusCode == 200) {
  //       return jsonDecode(response.body);
  //     } else {
  //       print('API Error: ${response.statusCode} - ${response.body}');
  //       return null;
  //     }
  //   } catch (e) {
  //     print('Network Error: $e');
  //     return null;
  //   }
  // }

  /// Generates a device authentication code and QR code
  ///
  /// Makes a POST request to /auth/device/generate with device ID
  /// Returns DeviceGenerateResponse with code, QR code and expiry time
  static Future<ApiResponse<DeviceGenerateResponse>> generateDeviceAuth(
    String deviceId,
  ) async {
    final requestData = DeviceGenerateRequest(id: deviceId);

    return await ApiService.post(
      '$_authEndpoint/generate',
      requestData.toJson(),
      DeviceGenerateResponse.fromJson,
    );
  }

  /// Refreshes device authentication token
  ///
  /// Makes a POST request to /auth/device/refresh with current token
  /// Returns new token and expiry
  static Future<ApiResponse<Map<String, dynamic>>> refreshToken(
    String currentToken,
  ) async {
    final requestData = {'token': currentToken};

    return await ApiService.post(
      '$_authEndpoint/refresh',
      requestData,
      (json) => json,
    );
  }
}

/// Helper class for device authentication flow management
class DeviceAuthManager {
  static String? _currentDeviceId;
  static String? _currentToken;
  static DeviceGenerateResponse? _currentAuthData;

  /// Generate authentication for device
  static Future<DeviceGenerateResponse?> generateAuth(String deviceId) async {
    try {
      final response = await AuthApiService.generateDeviceAuth(deviceId);

      if (response.success && response.data != null) {
        _currentDeviceId = deviceId;
        _currentAuthData = response.data;
        return response.data;
      } else {
        throw Exception(response.error ?? 'Failed to generate device auth');
      }
    } catch (e) {
      print('Error generating device auth: $e');
      return null;
    }
  }

  /// Get current authentication data
  static DeviceGenerateResponse? get currentAuthData => _currentAuthData;

  /// Get current device ID
  static String? get currentDeviceId => _currentDeviceId;

  /// Get current token
  static String? get currentToken => _currentToken;

  /// Check if device is authenticated
  static bool get isAuthenticated => _currentToken != null;

  /// Clear current authentication data
  static void clearAuthData() {
    _currentDeviceId = null;
    _currentToken = null;
    _currentAuthData = null;
  }
}
