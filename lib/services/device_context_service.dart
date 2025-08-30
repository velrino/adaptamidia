import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../services/storage_service.dart';
import '../models/device_config.dart';

class DeviceContextService {
  static Future<Map<String, dynamic>> gather() async {
    final Map<String, dynamic> ctx = {};

    // User agent (simple, no extra deps)
    try {
      final di = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final a = await di.androidInfo;
        ctx['device'] = {
          'platform': 'android',
          'brand': a.brand,
          'model': a.model,
          'manufacturer': a.manufacturer,
          'device': a.device,
          'product': a.product,
          'sdk_int': a.version.sdkInt,
          'release': a.version.release,
        };
        ctx['user_agent'] =
            'SeeMidia Display (Android; ${a.brand} ${a.model}; SDK ${a.version.sdkInt})';
      } else if (Platform.isIOS) {
        final i = await di.iosInfo;
        ctx['device'] = {
          'platform': 'ios',
          'name': i.name,
          'model': i.model,
          'localizedModel': i.localizedModel,
          'systemVersion': i.systemVersion,
          'machine': i.utsname.machine,
        };
        ctx['user_agent'] =
            'SeeMidia Display (iOS; ${i.utsname.machine}; ${i.systemVersion})';
      } else {
        final base = await di.deviceInfo;
        final model = base.data['model'] ?? 'Unknown';
        ctx['device'] = {'platform': 'unknown', 'model': model};
        ctx['user_agent'] = 'SeeMidia Display ($model)';
      }
    } catch (_) {
      ctx['user_agent'] = 'SeeMidia Display';
    }

    // Timezone info
    try {
      final now = DateTime.now();
      ctx['timezone_name'] = now.timeZoneName;
      ctx['timezone_offset_minutes'] = now.timeZoneOffset.inMinutes;
    } catch (_) {}

    // IP addresses (local interfaces)
    try {
      final ifs = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLinkLocal: true,
      );
      final ips = <String>[];
      for (final ni in ifs) {
        for (final addr in ni.addresses) {
          if (!addr.isLoopback) {
            ips.add(addr.address);
          }
        }
      }
      if (ips.isNotEmpty) ctx['ips'] = ips;
    } catch (_) {}

    // Connectivity type
    try {
      final result = await Connectivity().checkConnectivity();
      String kind = 'none';
      if (result.contains(ConnectivityResult.wifi)) kind = 'wifi';
      else if (result.contains(ConnectivityResult.mobile)) kind = 'mobile';
      else if (result.contains(ConnectivityResult.ethernet)) kind = 'ethernet';
      else if (result.contains(ConnectivityResult.vpn)) kind = 'vpn';
      ctx['connectivity'] = kind;
    } catch (_) {}

    // App info
    try {
      final info = await PackageInfo.fromPlatform();
      ctx['app'] = {
        'name': info.appName,
        'package': info.packageName,
        'version': info.version,
        'build_number': info.buildNumber,
      };
    } catch (_) {}

    // Display config (saved during configuration)
    try {
      final DeviceConfig? cfg = await StorageService.getDeviceConfig();
      if (cfg != null) {
        ctx['display'] = {
          'orientation': cfg.orientation,
          'width': cfg.screenWidth,
          'height': cfg.screenHeight,
          'pixel_ratio': cfg.pixelRatio,
          'device_model': cfg.deviceModel,
        };
      }
    } catch (_) {}

    return ctx;
  }
}
