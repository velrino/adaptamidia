import '../models/device_auth.dart';
import '../services/api_service.dart';

class AuthApiService {
  static const String _authEndpoint = '/auth/device';

  /// Generates a device authentication code and QR code
  /// 
  /// Makes a POST request to /auth/device/generate with device ID
  /// Returns DeviceGenerateResponse with code, QR code and expiry time
  static Future<ApiResponse<DeviceGenerateResponse>> generateDeviceAuth(String deviceId) async {
    final requestData = DeviceGenerateRequest(id: deviceId);
    
    return await ApiService.post(
      '$_authEndpoint/generate',
      requestData.toJson(),
      DeviceGenerateResponse.fromJson,
    );
  }

  /// Checks the status of device authentication
  /// 
  /// Makes a GET request to /auth/device/status/{deviceId}
  /// Returns current authentication status and token if authenticated
  static Future<ApiResponse<DeviceAuthStatus>> checkAuthStatus(String deviceId) async {
    return await ApiService.get(
      '$_authEndpoint/status/$deviceId',
      DeviceAuthStatus.fromJson,
    );
  }

  /// Validates device authentication token
  /// 
  /// Makes a POST request to /auth/device/validate with token
  /// Returns validation status
  static Future<ApiResponse<Map<String, dynamic>>> validateToken(String token) async {
    final requestData = {'token': token};
    
    return await ApiService.post(
      '$_authEndpoint/validate',
      requestData,
      (json) => json,
    );
  }

  /// Refreshes device authentication token
  /// 
  /// Makes a POST request to /auth/device/refresh with current token
  /// Returns new token and expiry
  static Future<ApiResponse<Map<String, dynamic>>> refreshToken(String currentToken) async {
    final requestData = {'token': currentToken};
    
    return await ApiService.post(
      '$_authEndpoint/refresh',
      requestData,
      (json) => json,
    );
  }

  /// Revokes device authentication
  /// 
  /// Makes a DELETE request to /auth/device/revoke/{deviceId}
  /// Invalidates the device authentication
  static Future<ApiResponse<Map<String, dynamic>>> revokeDeviceAuth(String deviceId) async {
    return await ApiService.delete(
      '$_authEndpoint/revoke/$deviceId',
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

  /// Start polling for authentication status
  static Stream<DeviceAuthStatus> pollAuthStatus(String deviceId, {
    Duration interval = const Duration(seconds: 5),
    Duration timeout = const Duration(minutes: 10),
  }) async* {
    final startTime = DateTime.now();
    
    while (DateTime.now().difference(startTime) < timeout) {
      try {
        final response = await AuthApiService.checkAuthStatus(deviceId);
        
        if (response.success && response.data != null) {
          final status = response.data!;
          
          yield status;
          
          // Stop polling if authenticated or expired
          if (status.isAuthenticated || status.isExpired || status.isRejected) {
            if (status.isAuthenticated && status.token != null) {
              _currentToken = status.token;
            }
            break;
          }
        }
      } catch (e) {
        print('Error checking auth status: $e');
      }
      
      await Future.delayed(interval);
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