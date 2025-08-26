import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/storage_service.dart';
import '../services/remote_control_service.dart';
import 'configuration_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin, RemoteControlMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  final FocusNode _screenFocusNode = FocusNode();
  final FocusNode _emailFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();
  final FocusNode _loginButtonFocusNode = FocusNode();
  final FocusNode _settingsButtonFocusNode = FocusNode();
  int _currentFocusIndex = 0; // 0: email, 1: password, 2: login button, 3: settings
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
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    _screenFocusNode.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _loginButtonFocusNode.dispose();
    _settingsButtonFocusNode.dispose();
    super.dispose();
  }

  @override
  bool onRemoteKeyPressed(String keyName, int keyCode) {
    switch (keyName) {
      case 'DPAD_UP':
        setState(() {
          _currentFocusIndex = (_currentFocusIndex - 1) % 4;
          if (_currentFocusIndex < 0) _currentFocusIndex = 3;
          _updateFocus();
        });
        HapticFeedback.selectionClick();
        return true;
      case 'DPAD_DOWN':
        setState(() {
          _currentFocusIndex = (_currentFocusIndex + 1) % 4;
          _updateFocus();
        });
        HapticFeedback.selectionClick();
        return true;
      case 'DPAD_CENTER':
        _handleCenterPress();
        return true;
      case 'BACK':
        // Handle back button if needed
        return true;
      case 'MENU':
        _showConfigurationOptions();
        return true;
    }
    return false;
  }

  void _updateFocus() {
    switch (_currentFocusIndex) {
      case 0:
        _emailFocusNode.requestFocus();
        break;
      case 1:
        _passwordFocusNode.requestFocus();
        break;
      case 2:
        _loginButtonFocusNode.requestFocus();
        break;
      case 3:
        _settingsButtonFocusNode.requestFocus();
        break;
    }
  }

  void _handleCenterPress() {
    switch (_currentFocusIndex) {
      case 0:
        // Email field focused - could open virtual keyboard
        break;
      case 1:
        // Password field focused - toggle visibility
        setState(() {
          _isPasswordVisible = !_isPasswordVisible;
        });
        HapticFeedback.lightImpact();
        break;
      case 2:
        // Login button focused
        if (!_isLoading) {
          _handleLogin();
        }
        break;
      case 3:
        // Settings button focused
        _showConfigurationOptions();
        break;
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    await Future.delayed(const Duration(seconds: 2));

    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Login em desenvolvimento'),
        backgroundColor: Colors.orange,
      ),
    );
  }

  void _showConfigurationOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildConfigurationBottomSheet(),
    );
  }

  Widget _buildConfigurationBottomSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[850] : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: isDark ? Colors.grey[600] : Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Text(
            'Configurações do Display',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.grey[900],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Altere as configurações de orientação e tema',
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          _buildConfigOption(
            'Reconfigurar Orientação',
            'Alterar entre portrait e landscape',
            Icons.screen_rotation,
            () {
              Navigator.pop(context);
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (context) => const ConfigurationScreen(),
                ),
              );
            },
            isDark,
          ),
          const SizedBox(height: 12),
          _buildConfigOption(
            'Limpar Dados',
            'Resetar todas as configurações',
            Icons.refresh,
            () async {
              await StorageService.clearAll();
              Navigator.pop(context);
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (context) => const ConfigurationScreen(),
                ),
              );
            },
            isDark,
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
        ],
      ),
    );
  }

  Widget _buildConfigOption(
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
    bool isDark,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? Colors.grey[800] : Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: Colors.blue[600],
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : Colors.grey[900],
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: isDark ? Colors.grey[400] : Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return RawKeyboardListener(
      focusNode: _screenFocusNode,
      autofocus: true,
      onKey: handleRemoteKeyPress,
      child: Scaffold(
        backgroundColor: isDark ? Colors.grey[900] : Colors.grey[50],
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          automaticallyImplyLeading: false,
          actions: [
            Focus(
              focusNode: _settingsButtonFocusNode,
              child: IconButton(
                onPressed: _showConfigurationOptions,
                icon: Icon(
                  Icons.settings,
                  color: _currentFocusIndex == 3
                      ? Colors.blue[600]
                      : (isDark ? Colors.grey[400] : Colors.grey[600]),
                ),
                style: IconButton.styleFrom(
                  backgroundColor: _currentFocusIndex == 3
                      ? Colors.blue.withOpacity(0.1)
                      : Colors.transparent,
                ),
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 40),
                    _buildHeader(isDark),
                    const SizedBox(height: 60),
                    Expanded(
                      child: _buildLoginForm(isDark),
                    ),
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
      crossAxisAlignment: CrossAxisAlignment.start,
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
          'Bem-vindo',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.grey[900],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Faça login para acessar o sistema',
          style: TextStyle(
            fontSize: 16,
            color: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildLoginForm(bool isDark) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          _buildTextField(
            controller: _emailController,
            focusNode: _emailFocusNode,
            label: 'Email',
            hintText: 'seu@email.com',
            prefixIcon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
            isFocused: _currentFocusIndex == 0,
            validator: (value) {
              if (value?.isEmpty ?? true) {
                return 'Email é obrigatório';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value!)) {
                return 'Email inválido';
              }
              return null;
            },
            isDark: isDark,
          ),
          const SizedBox(height: 20),
          _buildTextField(
            controller: _passwordController,
            focusNode: _passwordFocusNode,
            label: 'Senha',
            hintText: '••••••••',
            prefixIcon: Icons.lock_outline,
            obscureText: !_isPasswordVisible,
            isFocused: _currentFocusIndex == 1,
            suffixIcon: IconButton(
              onPressed: () {
                setState(() {
                  _isPasswordVisible = !_isPasswordVisible;
                });
              },
              icon: Icon(
                _isPasswordVisible ? Icons.visibility_off : Icons.visibility,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
            validator: (value) {
              if (value?.isEmpty ?? true) {
                return 'Senha é obrigatória';
              }
              return null;
            },
            isDark: isDark,
          ),
          const SizedBox(height: 32),
          Focus(
            focusNode: _loginButtonFocusNode,
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _currentFocusIndex == 2
                      ? Colors.blue[700]
                      : Colors.blue[600],
                  foregroundColor: Colors.white,
                  elevation: _currentFocusIndex == 2 ? 4 : 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: _currentFocusIndex == 2
                        ? const BorderSide(color: Colors.blue, width: 2)
                        : BorderSide.none,
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
                        'Entrar',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 24),
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
                Icon(
                  Icons.info_outline,
                  color: Colors.blue[600],
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Controle Remoto: Use ↑↓ para navegar, OK para ações',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.grey[300] : Colors.blue[700],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Menu: Acessar configurações • OK no campo senha: Mostrar/ocultar',
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
          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String label,
    required String hintText,
    required IconData prefixIcon,
    required bool isDark,
    required bool isFocused,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      style: TextStyle(
        color: isDark ? Colors.white : Colors.grey[900],
        fontSize: 16,
      ),
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        prefixIcon: Icon(
          prefixIcon,
          color: isFocused
              ? Colors.blue[600]
              : (isDark ? Colors.grey[400] : Colors.grey[600]),
        ),
        suffixIcon: suffixIcon,
        labelStyle: TextStyle(
          color: isFocused
              ? Colors.blue[600]
              : (isDark ? Colors.grey[400] : Colors.grey[600]),
        ),
        hintStyle: TextStyle(
          color: isDark ? Colors.grey[500] : Colors.grey[400],
        ),
        filled: true,
        fillColor: isFocused
            ? (isDark ? Colors.grey[750] : Colors.blue[50])
            : (isDark ? Colors.grey[800] : Colors.white),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isDark ? Colors.grey[700]! : Colors.grey[300]!,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: isFocused
                ? Colors.blue
                : (isDark ? Colors.grey[700]! : Colors.grey[300]!),
            width: isFocused ? 2 : 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Colors.blue,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Colors.red,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Colors.red,
            width: 2,
          ),
        ),
      ),
    );
  }
}