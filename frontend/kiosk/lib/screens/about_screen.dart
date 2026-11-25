import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../services/env_service.dart';
import '../services/storage_service.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  String _version = '';
  String _buildNumber = '';
  String _package = '';
  String _deviceId = '';

  @override
  void initState() {
    super.initState();
    _loadInfo();
  }

  Future<void> _loadInfo() async {
    try {
      final info = await PackageInfo.fromPlatform();
      final deviceId = await StorageService.getOrCreateDeviceId();
      if (!mounted) return;
      setState(() {
        _version = info.version;
        _buildNumber = info.buildNumber;
        _package = info.packageName;
        _deviceId = deviceId;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final logo = isDark
        ? 'assets/images/logo-landscape-white.png'
        : 'assets/images/logo-landscape.png';

    return Scaffold(
      appBar: AppBar(title: const Text('Sobre')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Image.asset(logo, height: 80, fit: BoxFit.contain),
                const SizedBox(height: 24),
                Text(
                  'SeeMedIA Display',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                _infoRow(
                  'Versão',
                  _version.isEmpty ? '-' : '$_version ($_buildNumber)',
                ),
                _infoRow('Ambiente', Env.appEnv.toUpperCase()),
                _infoRow('Pacote', _package.isEmpty ? '-' : _package),
                _infoRow('Device ID', _deviceId.isEmpty ? '-' : _deviceId),
                const SizedBox(height: 16),
                Divider(color: Colors.grey.withOpacity(0.3)),
                const SizedBox(height: 16),
                Text(
                  'Suporte: seemedia.com.br',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w600)),
          Flexible(
            child: Text(value, overflow: TextOverflow.ellipsis, maxLines: 2),
          ),
        ],
      ),
    );
  }
}
