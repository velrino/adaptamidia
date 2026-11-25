import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../../services/storage_service.dart';
import '../../services/configuration_service.dart';
import '../../services/theme_service.dart';
import '../../widgets/company_units_list.dart';
import '../../debug/debug_insightface_button.dart';
import '../../services/env_service.dart';
import 'package:package_info_plus/package_info_plus.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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
        title: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Image.asset(
            isDark
                ? 'assets/images/logo-landscape-white.png'
                : 'assets/images/logo-landscape.png',
            height: 50,
            // fit: BoxFit.contain,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (Env.isDevelop ? Colors.orange : Colors.green)
                      .withOpacity(0.15),
                  border: Border.all(
                    color: Env.isDevelop ? Colors.orange : Colors.green,
                    width: 1,
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  Env.appEnv.toUpperCase(),
                  style: TextStyle(
                    fontSize: 12,
                    letterSpacing: 1.0,
                    color: Env.isDevelop ? Colors.orange : Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
          const DebugInsightFaceButton(),
          IconButton(
            onPressed: () async {
              await ThemeService.instance.toggleTheme();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Tema: ${ThemeService.instance.getThemeModeName()}',
                    ),
                    duration: const Duration(seconds: 1),
                  ),
                );
              }
            },
            icon: Icon(
              ThemeService.instance.getThemeIcon(),
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            tooltip:
                'Alternar tema: ${ThemeService.instance.getThemeModeName()}',
          ),
          IconButton(
            onPressed: () {
              ConfigurationService.instance.showConfigurationOptions(context);
            },
            icon: Icon(
              Icons.settings,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            tooltip: 'Configurações',
          ),
          IconButton(
            onPressed: () async {
              await StorageService.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
            icon: Icon(
              Icons.logout,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: const CompanyUnitsList(),
      bottomNavigationBar: _VersionFooter(isDark: isDark),
    );
  }
}

class _VersionFooter extends StatelessWidget {
  final bool isDark;
  const _VersionFooter({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PackageInfo>(
      future: PackageInfo.fromPlatform(),
      builder: (context, snapshot) {
        final pi = snapshot.data;
        final version = pi?.version ?? '';
        final build = pi?.buildNumber ?? '';
        final text = (version.isEmpty && build.isEmpty)
            ? 'Versão: --  •  Code: --'
            : 'Versão: $version  •  Code: $build';
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          decoration: BoxDecoration(
            color: isDark ? Colors.grey[850] : Colors.white,
            border: Border(
              top: BorderSide(
                color: (isDark ? Colors.grey[800]! : Colors.grey[300]!),
                width: 1,
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.grey[400] : Colors.grey[700],
              ),
            ),
          ),
        );
      },
    );
  }
}
