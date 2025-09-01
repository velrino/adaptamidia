import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/configuration_service.dart';
import '../../widgets/company_units_list.dart';
import '../example.dart';

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
          IconButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const MyHomePage()),
              );
            },
            icon: Icon(
              Icons.play_circle_fill,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            tooltip: 'VLC Player Demo',
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
    );
  }
}
