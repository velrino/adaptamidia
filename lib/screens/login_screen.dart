import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../services/auth_api_service.dart';
import '../services/firebase_service.dart';
import '../services/auth_success_service.dart';
import '../services/configuration_service.dart';
import '../utils/device_utils.dart';
import 'dart:convert';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  bool _isLoading = false;
  bool _isWaitingForAuth = false;
  String? _qrCodeData;
  String? _deviceId;
  String? _authCode;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Curves.easeOutCubic,
          ),
        );
    _animationController.forward();
    _checkIfLoggedIn();
  }

  Future<void> _checkIfLoggedIn() async {
    final token = await StorageService.getAuthToken();
    if (token != null) {
      // User already logged in, redirect to home
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);

    try {
      // Generate unique device ID
      _deviceId = await DeviceUtils.instance.generateNewDeviceId();

      // Call generateAuth API
      final response = await AuthApiService.generateDeviceAuth(_deviceId!);

      if (response.success && response.data != null) {
        final authResponse = response.data!;
        setState(() {
          _qrCodeData = authResponse.qrCode;
          _authCode = authResponse.code;
          _isLoading = false;
          _isWaitingForAuth = true;
        });

        print('Auth Code: $_authCode');

        // Start listening for auth on Firebase
        _startFirebaseListener();
      } else {
        _showError('Erro ao gerar QR Code');
      }
    } catch (e) {
      _showError('Erro na conexão: $e');
    }
  }

  void _startFirebaseListener() {
    FirebaseService.instance.listenOnceForAuthDevice(
      _deviceId!,
      (authData) {
        // Success! User authenticated
        _handleAuthSuccess(authData);
      },
      (error) {
        _showError('Erro na autenticação: $error');
      },
    );
  }

  Future<void> _handleAuthSuccess(Map<String, dynamic> authData) async {
    try {
      if (mounted) {
        await AuthSuccessService.instance.handleAuthSuccessFromMap(
          context,
          authData,
        );
      }
    } catch (e) {
      print('Error in _handleAuthSuccess: $e');
      _showError('Erro ao salvar dados de login: $e');
    }
  }

  void _showError(String message) {
    setState(() {
      _isLoading = false;
      _isWaitingForAuth = false;
      _qrCodeData = null;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  void _showConfigurationOptions() {
    ConfigurationService.instance.showConfigurationOptions(context);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? Colors.grey[900] : Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: _showConfigurationOptions,
            icon: Icon(
              Icons.settings,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 40),
                  _buildHeader(isDark),
                  const SizedBox(height: 60),
                  Expanded(child: _buildMainContent(isDark)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.blue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.blue.withOpacity(0.3)),
          ),
          child: Text(
            'SeeMidia Display',
            style: TextStyle(
              color: Colors.blue[600],
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Autenticação por QR Code',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.grey[900],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Escaneie o QR Code com seu dispositivo móvel para fazer login',
          style: TextStyle(
            fontSize: 16,
            color: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildMainContent(bool isDark) {
    if (_isWaitingForAuth && _qrCodeData != null) {
      return _buildQRCodeDisplay(isDark);
    }

    return _buildLoginButton(isDark);
  }

  Widget _buildQRCodeDisplay(bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // QR Code
                Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.memory(
                      base64Decode(_qrCodeData!.split(',')[1]),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Auth Code
                if (_authCode != null) ...[
                  Text(
                    'Código: $_authCode',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                Text(
                  'Escaneie este QR Code',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          // Loading indicator
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            'Aguardando autenticação...',
            style: TextStyle(
              fontSize: 16,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          // Cancel button
          TextButton(
            onPressed: () {
              setState(() {
                _isWaitingForAuth = false;
                _qrCodeData = null;
                _authCode = null;
              });
            },
            child: Text(
              'Cancelar',
              style: TextStyle(color: Colors.blue[600], fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginButton(bool isDark) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          width: 300,
          height: 56,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[600],
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Gerar QR Code',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
          ),
        ),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? Colors.grey[800] : Colors.blue[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? Colors.grey[700]! : Colors.blue[200]!,
            ),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.blue[600], size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Toque no botão para gerar o QR Code de autenticação',
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.grey[300] : Colors.blue[700],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
