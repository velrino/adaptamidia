import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:seemidia/services/uvc_camera_service.dart';
import '../services/storage_service.dart';
import '../screens/configuration_screen.dart';
import 'remote_control_service.dart';
import '../screens/about_screen.dart';

class ConfigurationService {
  static ConfigurationService? _instance;
  static ConfigurationService get instance =>
      _instance ??= ConfigurationService._internal();

  ConfigurationService._internal();
  bool _cameraStateChangedDuringSheet = false;

  /// Shows the configuration bottom sheet
  void showConfigurationOptions(BuildContext context) {
    // Ensure the config sheet overlays everything (including camera preview)
    // by temporarily hiding the camera overlay and restoring after dismiss,
    // unless the user explicitly changes it inside the sheet.
    final wasCameraVisible = UvcCameraService.instance.previewVisible.value;
    if (wasCameraVisible) {
      UvcCameraService.instance.hidePreview();
    }
    _cameraStateChangedDuringSheet = false;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildConfigurationBottomSheet(context),
    ).whenComplete(() {
      if (!_cameraStateChangedDuringSheet) {
        if (wasCameraVisible) {
          UvcCameraService.instance.showPreview();
        } else {
          UvcCameraService.instance.hidePreview();
        }
      }
      _cameraStateChangedDuringSheet = false;
    });
  }

  Widget _buildConfigurationBottomSheet(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _ConfigurationBottomSheet(
      isDark: isDark,
      onCameraStateChanged: () {
        _cameraStateChangedDuringSheet = true;
      },
    );
  }
}

// Widget separado para gerenciar estado e controle remoto
class _ConfigurationBottomSheet extends StatefulWidget {
  final bool isDark;
  final VoidCallback onCameraStateChanged;

  const _ConfigurationBottomSheet({
    required this.isDark,
    required this.onCameraStateChanged,
  });

  @override
  State<_ConfigurationBottomSheet> createState() =>
      _ConfigurationBottomSheetState();
}

class _ConfigurationBottomSheetState extends State<_ConfigurationBottomSheet>
    with RemoteControlMixin {
  int _selectedIndex = 0;
  final FocusNode _focusNode = FocusNode();
  final List<_ConfigOption> _options = [];

  @override
  void initState() {
    super.initState();
    _buildOptions();
    // Requisita foco para capturar teclas do controle remoto
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  void _buildOptions() {
    _options.clear();
    _options.addAll([
      _ConfigOption(
        title: 'Reconfigurar Orientação',
        subtitle: 'Alterar entre portrait e landscape',
        icon: Icons.screen_rotation,
        onTap: () {
          Navigator.pop(context);
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const ConfigurationScreen(),
            ),
          );
        },
      ),
      _ConfigOption(
        title: 'Exibir Câmera USB',
        subtitle: 'Mostra a webcam como overlay',
        icon: Icons.visibility,
        onTap: () {
          widget.onCameraStateChanged();
          UvcCameraService.instance.showPreview();
          Navigator.pop(context);
        },
      ),
      _ConfigOption(
        title: 'Ocultar Câmera USB',
        subtitle: 'Esconde a webcam (overlay)',
        icon: Icons.visibility_off,
        onTap: () {
          widget.onCameraStateChanged();
          UvcCameraService.instance.hidePreview();
          Navigator.pop(context);
        },
      ),

      _ConfigOption(
        title: 'Sobre',
        subtitle: 'Informações do app e suporte',
        icon: Icons.info_outline,
        onTap: () {
          Navigator.pop(context);
          Navigator.of(
            context,
          ).push(MaterialPageRoute(builder: (context) => const AboutScreen()));
        },
      ),
      _ConfigOption(
        title: 'Limpar Dados',
        subtitle: 'Resetar todas as configurações',
        icon: Icons.refresh,
        onTap: () async {
          await StorageService.clearAll();
          Navigator.pop(context);
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const ConfigurationScreen(),
            ),
          );
        },
      ),
    ]);
  }

  @override
  bool onRemoteKeyPressed(String keyName, int keyCode) {
    debugPrint('[ConfigurationService] Remote key: $keyName');

    switch (keyName) {
      case 'DPAD_UP':
        setState(() {
          _selectedIndex = (_selectedIndex - 1).clamp(0, _options.length - 1);
        });
        HapticFeedback.selectionClick();
        return true;

      case 'DPAD_DOWN':
        setState(() {
          _selectedIndex = (_selectedIndex + 1).clamp(0, _options.length - 1);
        });
        HapticFeedback.selectionClick();
        return true;

      case 'DPAD_CENTER':
      case 'NUMBER_5':
        if (_selectedIndex < _options.length) {
          HapticFeedback.heavyImpact();
          _options[_selectedIndex].onTap();
        }
        return true;

      case 'BACK':
      case 'MENU':
        Navigator.pop(context);
        return true;

      // Atalhos numéricos para acesso direto
      case 'NUMBER_1':
        if (_options.isNotEmpty) {
          HapticFeedback.selectionClick();
          _options[0].onTap();
        }
        return true;

      case 'NUMBER_2':
        if (_options.length > 1) {
          HapticFeedback.selectionClick();
          _options[1].onTap();
        }
        return true;

      case 'NUMBER_3':
        if (_options.length > 2) {
          HapticFeedback.selectionClick();
          _options[2].onTap();
        }
        return true;

      case 'NUMBER_4':
        if (_options.length > 3) {
          HapticFeedback.selectionClick();
          _options[3].onTap();
        }
        return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return RawKeyboardListener(
      focusNode: _focusNode,
      autofocus: true,
      onKey: handleRemoteKeyPress,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: widget.isDark ? Colors.grey[850] : Colors.white,
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
                color: widget.isDark ? Colors.grey[600] : Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Text(
              'Configurações do Display',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: widget.isDark ? Colors.white : Colors.grey[900],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Altere as configurações de orientação e tema',
              style: TextStyle(
                fontSize: 14,
                color: widget.isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
            const SizedBox(height: 24),
            // Renderiza as opções com destaque para a selecionada
            ...List.generate(_options.length, (index) {
              final option = _options[index];
              final isSelected = index == _selectedIndex;

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildConfigOption(
                  context,
                  option.title,
                  option.subtitle,
                  option.icon,
                  option.onTap,
                  widget.isDark,
                  isSelected,
                  index + 1, // Número do atalho
                ),
              );
            }),
            // Instruções do controle remoto
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: widget.isDark ? Colors.grey[800] : Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.settings_remote,
                    size: 16,
                    color: widget.isDark ? Colors.grey[400] : Colors.blue[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '↑↓ Navegar | OK Selecionar | 1-4 Atalhos',
                    style: TextStyle(
                      fontSize: 12,
                      color: widget.isDark
                          ? Colors.grey[400]
                          : Colors.blue[600],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
          ],
        ),
      ),
    );
  }

  Widget _buildConfigOption(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
    bool isDark,
    bool isSelected,
    int shortcutNumber,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? Colors.blue.withOpacity(0.15)
              : (isDark ? Colors.grey[800] : Colors.grey[50]),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? Colors.blue
                : (isDark ? Colors.grey[700]! : Colors.grey[200]!),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: Colors.blue[600], size: 20),
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
            Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Colors.blue
                        : Colors.grey.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    shortcutNumber.toString(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isSelected
                          ? Colors.white
                          : (isDark ? Colors.grey[400] : Colors.grey[600]),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: isSelected
                      ? Colors.blue
                      : (isDark ? Colors.grey[400] : Colors.grey[400]),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Classe para representar uma opção de configuração
class _ConfigOption {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  _ConfigOption({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });
}
