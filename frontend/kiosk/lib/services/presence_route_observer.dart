import 'package:flutter/material.dart';

import 'device_presence_service.dart';

/// Global route observer that updates DevicePresenceService on navigation.
class PresenceRouteObserver extends RouteObserver<PageRoute<dynamic>> {
  PresenceRouteObserver._();
  static final PresenceRouteObserver instance = PresenceRouteObserver._();

  void _updateFor(Route<dynamic>? route) {
    if (route is! PageRoute) return;
    final name = route.settings.name ?? route.runtimeType.toString();
    final screen = _normalizeScreenName(name);

    // Start if needed; otherwise update
    DevicePresenceService.instance
        .updateScreen(screen)
        .catchError((_) async {
      // If update failed because not started yet, start now
      await DevicePresenceService.instance
          .start(currentScreen: screen)
          .catchError((_) {});
    });
  }

  String _normalizeScreenName(String raw) {
    final r = raw.toLowerCase();
    if (r.contains('display')) return 'DISPLAY';
    if (r.contains('login')) return 'LOGIN';
    if (r.contains('home')) return 'HOME';
    if (r.contains('config')) return 'CONFIG';
    if (r.contains('about')) return 'ABOUT';
    return raw.toUpperCase();
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    _updateFor(route);
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    _updateFor(newRoute);
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    _updateFor(previousRoute);
  }
}

