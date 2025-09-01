import 'package:flutter/material.dart';
import 'package:seemidia/services/uvc_camera_service.dart';
import '../services/storage_service.dart';
import '../screens/configuration_screen.dart';

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
            context,
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
          ValueListenableBuilder<bool>(
            valueListenable: UvcCameraService.instance.previewVisible,
            builder: (context, visible, _) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildConfigOption(
                    context,
                    'Exibir Câmera USB',
                    'Mostra a webcam como overlay',
                    Icons.visibility,
                    () {
                      _cameraStateChangedDuringSheet = true;
                      UvcCameraService.instance.showPreview();
                      Navigator.pop(context);
                    },
                    isDark,
                  ),
                  const SizedBox(height: 12),
                  _buildConfigOption(
                    context,
                    'Ocultar Câmera USB',
                    'Esconde a webcam (overlay)',
                    Icons.visibility_off,
                    () {
                      _cameraStateChangedDuringSheet = true;
                      UvcCameraService.instance.hidePreview();
                      Navigator.pop(context);
                    },
                    isDark,
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          _buildConfigOption(
            context,
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
    BuildContext context,
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
}
