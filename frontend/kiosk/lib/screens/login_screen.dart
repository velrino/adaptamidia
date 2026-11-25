import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../services/auth_api_service.dart';
import '../services/firebase_service.dart';
import '../services/auth_success_service.dart';
import '../services/configuration_service.dart';
import '../utils/device_utils.dart';
import 'dart:convert';
import 'dart:async';

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
  Timer? _qrCodeTimer;
  int _remainingSeconds = 300; // 5 minutes
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
    _qrCodeTimer?.cancel();
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
          _remainingSeconds = 300; // Reset to 5 minutes
        });

        print('Auth Code: $_authCode');

        // Start QR code timer
        _startQRCodeTimer();

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
        _qrCodeTimer?.cancel(); // Cancel timer on success
        _handleAuthSuccess(authData);
      },
      (error) {
        _showError('Erro na autenticação: $error');
      },
    );
  }

  void _startQRCodeTimer() {
    _qrCodeTimer?.cancel();
    _qrCodeTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _remainingSeconds--;
      });

      if (_remainingSeconds <= 0) {
        timer.cancel();
        _handleQRCodeExpired();
      }
    });
  }

  void _handleQRCodeExpired() {
    setState(() {
      _isWaitingForAuth = false;
      _qrCodeData = null;
      _authCode = null;
      _remainingSeconds = 300;
    });
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  Future<void> _handleAuthSuccess(dynamic authData) async {
    try {
      if (mounted) {
        // If it's FirebaseAuthData, convert to Map
        if (authData is Map<String, dynamic>) {
          await AuthSuccessService.instance.handleAuthSuccessFromMap(
            context,
            authData,
          );
        } else {
          // It's FirebaseAuthData interface
          await AuthSuccessService.instance.handleAuthSuccessFromMap(
            context,
            authData.toJson(),
          );
        }
      }
    } catch (e) {
      print('Error in _handleAuthSuccess: $e');
      _showError('Erro ao salvar dados de login: $e');
    }
  }

  void _showError(String message) {
    _qrCodeTimer?.cancel(); // Cancel timer on error
    setState(() {
      _isLoading = false;
      _isWaitingForAuth = false;
      _qrCodeData = null;
      _remainingSeconds = 300;
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
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _buildHeader(isDark),
                    const SizedBox(height: 40),
                    _buildMainContent(isDark),
                  ],
                ),
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

          child: Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Image.asset(
              'assets/images/logo.png',
              height: 200,
              // fit: BoxFit.contain,
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
          'Será gerado códgio para vincular seu dispositivo',
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
                  'Digite o código ou escaneie este QR Code',
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
          // Timer display
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _remainingSeconds <= 60
                  ? Colors.red.withValues(alpha: 0.1)
                  : Colors.blue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _remainingSeconds <= 60
                    ? Colors.red.withValues(alpha: 0.3)
                    : Colors.blue.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 20,
                  color: _remainingSeconds <= 60
                      ? Colors.red[600]
                      : Colors.blue[600],
                ),
                const SizedBox(width: 8),
                Text(
                  'Expira em: ${_formatTime(_remainingSeconds)}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: _remainingSeconds <= 60
                        ? Colors.red[600]
                        : Colors.blue[600],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Cancel button
          TextButton(
            onPressed: () {
              _qrCodeTimer?.cancel();
              setState(() {
                _isWaitingForAuth = false;
                _qrCodeData = null;
                _authCode = null;
                _remainingSeconds = 300;
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
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 300),
          child: SizedBox(
            width: double.infinity,
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
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}
