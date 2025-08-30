import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';

class DeviceContextService {
  static Future<Map<String, dynamic>> gather() async {
    final Map<String, dynamic> ctx = {};

    // User agent (simple, no extra deps)
    try {
      final di = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final a = await di.androidInfo;
        ctx['user_agent'] =
            'SeeMidia Display (Android; ${a.brand} ${a.model}; SDK ${a.version.sdkInt})';
      } else if (Platform.isIOS) {
        final i = await di.iosInfo;
        ctx['user_agent'] =
            'SeeMidia Display (iOS; ${i.utsname.machine}; ${i.systemVersion})';
      } else {
        final base = await di.deviceInfo;
        final model = base.data['model'] ?? 'Unknown';
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

    return ctx;
  }
}
