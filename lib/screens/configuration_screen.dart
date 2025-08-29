import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/device_config.dart';
import '../services/storage_service.dart';
import '../services/remote_control_service.dart';
import 'login_screen.dart';

class ConfigurationScreen extends StatefulWidget {
  const ConfigurationScreen({super.key});

  @override
  State<ConfigurationScreen> createState() => _ConfigurationScreenState();
}

class _ConfigurationScreenState extends State<ConfigurationScreen>
    with TickerProviderStateMixin, RemoteControlMixin {
  String selectedOrientation = 'portrait';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  bool _isLoading = false;
  int _selectedIndex = 0; // 0 = portrait, 1 = landscape
  final FocusNode _focusNode = FocusNode();

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
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  bool onRemoteKeyPressed(String keyName, int keyCode) {
    switch (keyName) {
      case 'DPAD_UP':
      case 'DPAD_DOWN':
        setState(() {
          _selectedIndex = _selectedIndex == 0 ? 1 : 0;
          selectedOrientation = _selectedIndex == 0 ? 'portrait' : 'landscape';
        });
        HapticFeedback.selectionClick();
        return true;
      case 'DPAD_CENTER':
        if (!_isLoading) {
          _saveConfiguration();
        }
        return true;
      case 'BACK':
        // Handle back button if needed
        return true;
    }
    return false;
  }

  Future<void> _saveConfiguration() async {
    setState(() => _isLoading = true);

    final mediaQuery = MediaQuery.of(context);
    final deviceInfo = Platform.isAndroid ? 'Android Device' : 'Unknown Device';

    final config = DeviceConfig(
      orientation: selectedOrientation,
      screenWidth: mediaQuery.size.width,
      screenHeight: mediaQuery.size.height,
      pixelRatio: mediaQuery.devicePixelRatio,
      deviceModel: deviceInfo,
      configuredAt: DateTime.now(),
    );

    await StorageService.saveDeviceConfig(config);

    if (selectedOrientation == 'landscape') {
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    } else {
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);
    }

    setState(() => _isLoading = false);

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return RawKeyboardListener(
      focusNode: _focusNode,
      autofocus: true,
      onKey: handleRemoteKeyPress,
      child: Scaffold(
        backgroundColor: isDark ? Colors.grey[900] : Colors.grey[50],
        body: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 40),
                  _buildHeader(isDark),
                  const SizedBox(height: 60),
                  Expanded(child: _buildOrientationSelector(isDark)),
                  _buildBottomSection(isDark),
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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Image.asset(
            'assets/images/logo.png',
            height: 100,
            // fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Configuração Inicial',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.grey[900],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Escolha a orientação ideal para este display',
          style: TextStyle(
            fontSize: 16,
            color: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildOrientationSelector(bool isDark) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildOrientationCard(
            'portrait',
            'Portrait',
            'Ideal para menus e promoções verticais',
            Icons.stay_current_portrait,
            isDark,
            _selectedIndex == 0,
          ),
          const SizedBox(height: 20),
          _buildOrientationCard(
            'landscape',
            'Landscape',
            'Ideal para vídeos e conteúdo horizontal',
            Icons.stay_current_landscape,
            isDark,
            _selectedIndex == 1,
          ),
        ],
      ),
    );
  }

  Widget _buildOrientationCard(
    String orientation,
    String title,
    String subtitle,
    IconData icon,
    bool isDark,
    bool isRemoteSelected,
  ) {
    final isSelected = selectedOrientation == orientation || isRemoteSelected;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedOrientation = orientation;
          _selectedIndex = orientation == 'portrait' ? 0 : 1;
        });
        HapticFeedback.lightImpact();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isSelected
              ? Colors.blue.withOpacity(0.1)
              : (isDark ? Colors.grey[800] : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? Colors.blue
                : (isDark ? Colors.grey[700]! : Colors.grey[300]!),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            if (!isDark)
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.blue
                    : (isDark ? Colors.grey[700] : Colors.grey[100]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 32,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.grey[300] : Colors.grey[600]),
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.grey[900],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, size: 16, color: Colors.white),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomSection(bool isDark) {
    return Column(
      children: [
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Controle Remoto: Use ↑↓ para navegar, OK para confirmar',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.grey[300] : Colors.blue[700],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Esta configuração pode ser alterada posteriormente nas configurações',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.grey[400] : Colors.blue[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _saveConfiguration,
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
                    'Continuar',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
          ),
        ),
      ],
    );
  }
}
