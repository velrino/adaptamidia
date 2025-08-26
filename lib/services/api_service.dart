import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'logger_service.dart';

class ApiService {
  static const String _baseUrl = 'http://localhost:4001';
  static const Duration _timeout = Duration(seconds: 30);
  
  static final Map<String, String> _defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  static Future<ApiResponse<T>> _makeRequest<T>(
    String method,
    String endpoint,
    Map<String, dynamic>? data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      
      // Log the request
      LoggerService.apiRequest(method, endpoint, data: data);
      
      http.Response response;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(
            uri,
            headers: _defaultHeaders,
          ).timeout(_timeout);
          break;
        case 'POST':
          response = await http.post(
            uri,
            headers: _defaultHeaders,
            body: data != null ? jsonEncode(data) : null,
          ).timeout(_timeout);
          break;
        case 'PUT':
          response = await http.put(
            uri,
            headers: _defaultHeaders,
            body: data != null ? jsonEncode(data) : null,
          ).timeout(_timeout);
          break;
        case 'DELETE':
          response = await http.delete(
            uri,
            headers: _defaultHeaders,
          ).timeout(_timeout);
          break;
        default:
          throw ApiException('Método HTTP não suportado: $method');
      }

      final apiResponse = _handleResponse<T>(response, fromJson);
      
      // Log the response
      if (apiResponse.success) {
        LoggerService.apiResponse(endpoint, response.statusCode, response: apiResponse.data);
      } else {
        LoggerService.apiResponse(endpoint, response.statusCode, error: apiResponse.error);
      }
      
      return apiResponse;
    } on SocketException catch (e) {
      LoggerService.apiError(endpoint, e);
      throw ApiException('Erro de conexão. Verifique sua internet.');
    } on HttpException catch (e) {
      LoggerService.apiError(endpoint, e);
      throw ApiException('Erro HTTP. Servidor indisponível.');
    } on FormatException catch (e) {
      LoggerService.apiError(endpoint, e);
      throw ApiException('Erro de formato. Resposta inválida do servidor.');
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      LoggerService.apiError(endpoint, e);
      throw ApiException('Erro inesperado: ${e.toString()}');
    }
  }

  static ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final statusCode = response.statusCode;
    
    try {
      final jsonData = jsonDecode(response.body) as Map<String, dynamic>;
      
      if (statusCode >= 200 && statusCode < 300) {
        return ApiResponse<T>(
          success: true,
          data: fromJson(jsonData),
          statusCode: statusCode,
        );
      } else {
        return ApiResponse<T>(
          success: false,
          error: jsonData['message'] ?? 'Erro do servidor',
          statusCode: statusCode,
        );
      }
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: 'Erro ao processar resposta do servidor',
        statusCode: statusCode,
        rawResponse: response.body,
      );
    }
  }

  // GET request
  static Future<ApiResponse<T>> get<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    return _makeRequest('GET', endpoint, null, fromJson);
  }

  // POST request
  static Future<ApiResponse<T>> post<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    return _makeRequest('POST', endpoint, data, fromJson);
  }

  // PUT request
  static Future<ApiResponse<T>> put<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    return _makeRequest('PUT', endpoint, data, fromJson);
  }

  // DELETE request
  static Future<ApiResponse<T>> delete<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    return _makeRequest('DELETE', endpoint, null, fromJson);
  }
}

// Response wrapper class
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final int statusCode;
  final String? rawResponse;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    required this.statusCode,
    this.rawResponse,
  });

  @override
  String toString() {
    return 'ApiResponse(success: $success, data: $data, error: $error, statusCode: $statusCode)';
  }
}

// Custom exception class
class ApiException implements Exception {
  final String message;
  
  ApiException(this.message);

  @override
  String toString() => 'ApiException: $message';
}