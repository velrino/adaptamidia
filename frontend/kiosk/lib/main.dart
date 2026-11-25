import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'services/storage_service.dart';
import 'services/firebase_service.dart';
import 'services/theme_service.dart';
import 'screens/configuration_screen.dart';
import 'screens/login_screen.dart';
import 'screens/authenticated/home_screen.dart';
import 'screens/authenticated/display_screen.dart';
// import 'screens/camera_screen.dart'; // removed: using overlay toggle
import 'components/uvc_camera_host.dart';
import 'services/background_detection_service.dart';
import 'services/insightface_service.dart';
import 'services/env_service.dart';
import 'services/presence_route_observer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Enforce APP_ENV is provided correctly
  Env.validateOrThrow();

  // Initialize Firebase
  await FirebaseService.instance.initialize();

  // Disable debug borders and overlays
  debugPaintSizeEnabled = false;

  // Set fullscreen mode immediately
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.immersiveSticky,
    overlays: [],
  );

  // Additional system UI settings
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: ThemeService.instance,
      builder: (context, child) {
        return MaterialApp(
          title: 'SeeMedIA Display',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
            brightness: Brightness.light,
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.blue,
              brightness: Brightness.dark,
            ),
            brightness: Brightness.dark,
            useMaterial3: true,
          ),
          themeMode: ThemeService.instance.themeMode,
          builder: (context, child) =>
              UvcCameraHost(child: child ?? const SizedBox.shrink()),
          navigatorObservers: [PresenceRouteObserver.instance],
          home: const AppWrapper(),
          routes: {
            '/home': (context) => const HomeScreen(),
            '/login': (context) => const LoginScreen(),
            '/config': (context) => const ConfigurationScreen(),
            // '/camera': (context) => const CameraScreen(), // removed
          },
          onGenerateRoute: (settings) {
            if (settings.name == '/display') {
              final unitId = settings.arguments as String;
              return MaterialPageRoute(
                builder: (context) => DisplayScreen(unitId: unitId),
              );
            }
            return null;
          },
          debugShowCheckedModeBanner: false,
        );
      },
    );
  }
}

class AppWrapper extends StatefulWidget {
  const AppWrapper({super.key});

  @override
  State<AppWrapper> createState() => _AppWrapperState();
}

class _AppWrapperState extends State<AppWrapper> {
  bool _isConfigured = false;
  bool _isLoading = true;
  bool _modelsReady = false;
  String _loadingStep = 'Iniciando...';

  @override
  void initState() {
    super.initState();
    _checkConfiguration();
  }

  Future<void> _checkConfiguration() async {
    final isConfigured = await StorageService.isDeviceConfigured();

    if (isConfigured) {
      final config = await StorageService.getDeviceConfig();
      if (config != null) {
        if (config.isLandscape) {
          await SystemChrome.setPreferredOrientations([
            DeviceOrientation.landscapeLeft,
            DeviceOrientation.landscapeRight,
          ]);
        } else {
          await SystemChrome.setPreferredOrientations([
            DeviceOrientation.portraitUp,
          ]);
        }
      }
    }

    setState(() {
      _isConfigured = isConfigured;
      _isLoading = false;
    });

    if (isConfigured) {
      await _initModels();
    }
  }

  Future<void> _initModels() async {
    setState(() {
      _loadingStep = 'Carregando modelos (YOLO, InsightFace)...';
      _modelsReady = false;
    });
    try {
      // YOLO (TFLite) – carrega modelo e mantém instância viva
      setState(() {
        _loadingStep = 'Carregando YOLO...';
      });
      await BackgroundDetectionService.instance.ensureLoaded();

      // InsightFace (Android on-device). Em outras plataformas, retorna false e segue.
      setState(() {
        _loadingStep = 'Carregando InsightFace...';
      });
      await InsightFaceService.instance.ensureInitialized();

      setState(() {
        _modelsReady = true;
      });
    } catch (_) {
      // Mesmo se falhar, seguimos para que o app abra; serviços lidam com fallback.
      setState(() {
        _modelsReady = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Carregando...'),
            ],
          ),
        ),
      );
    }

    if (!_isConfigured) {
      return const ConfigurationScreen();
    }

    // Check if user is logged in
    return FutureBuilder<bool>(
      future: StorageService.isLoggedIn(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Gate de carregamento dos modelos críticos antes de entrar no app
        if (!_modelsReady) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(_loadingStep),
                ],
              ),
            ),
          );
        }

        if (snapshot.data == true) {
          return const HomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
