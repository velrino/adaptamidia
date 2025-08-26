import 'package:flutter/material.dart';
import '../models/auth_response.dart';
import '../services/storage_service.dart';

class AuthSuccessService {
  static AuthSuccessService? _instance;
  static AuthSuccessService get instance =>
      _instance ??= AuthSuccessService._internal();

  AuthSuccessService._internal();

  /// Handles successful authentication by saving data and redirecting
  Future<void> handleAuthSuccess(
    BuildContext context,
    AuthResponse authData,
  ) async {
    try {
      // Save auth token and user data
      await StorageService.saveAuthToken(authData.accessToken);
      await StorageService.saveUserData({
        'id': authData.id,
        'session': authData.session,
        'expires_in': authData.expiresIn,
        'iat': authData.iat,
        'exp': authData.exp,
      });

      if (context.mounted) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Login realizado com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );

        // Redirect to home
        Navigator.of(context).pushReplacementNamed('/home');
      }
    } catch (e) {
      print(e);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao salvar dados de login: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      rethrow;
    }
  }

  /// Handles successful authentication from Map data (for compatibility)
  Future<void> handleAuthSuccessFromMap(
    BuildContext context,
    Map<String, dynamic> authData,
  ) async {
    final authResponse = AuthResponse.fromJson(authData);
    await handleAuthSuccess(context, authResponse);
  }
}
