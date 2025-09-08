import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import 'api_service.dart';
import 'storage_service.dart';
import '../models/auth_response.dart';

class TokenRefreshService {
  TokenRefreshService._internal();
  static final TokenRefreshService instance = TokenRefreshService._internal();

  Timer? _timer;
  StreamSubscription? _connSub;
  Duration _interval = const Duration(hours: 6);
  bool _busy = false;

  void start({Duration? interval}) {
    _interval = interval ?? _interval;
    _timer?.cancel();
    // First tick delayed to avoid competing with startup requests
    _timer = Timer.periodic(_interval, (_) => _maybeRefresh());
    // also schedule a one-shot after 30s to catch short sessions
    Timer(const Duration(seconds: 30), _maybeRefresh);
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _connSub?.cancel();
    _connSub = null;
  }

  Future<void> _maybeRefresh() async {
    if (_busy) return;
    final token = await StorageService.getAuthToken();
    if (token == null || token.isEmpty) return;

    final online = await _isOnline();
    if (!online) {
      // Wait until online, then do a single refresh
      _connSub?.cancel();
      _connSub = Connectivity().onConnectivityChanged.listen((status) async {
        final isNowOnline = await _isOnlineFrom(status);
        if (isNowOnline) {
          _connSub?.cancel();
          _connSub = null;
          await _refreshNow(token);
        }
      });
      return;
    }

    await _refreshNow(token);
  }

  Future<void> _refreshNow(String token) async {
    if (_busy) return;
    _busy = true;
    try {
      final res = await ApiService.get<AuthResponse>(
        '/auth/refresh-token',
        (m) => AuthResponse.fromJson(m),
        headers: {
          'Authorization': 'Bearer $token',
          'ngrok-skip-browser-warning': 'true',
        },
      );
      if (res.success && res.data != null) {
        final a = res.data!;
        await StorageService.saveAuthToken(a.accessToken);
        await StorageService.saveUserData({
          'id': a.id,
          'session': a.session,
          'expires_in': a.expiresIn,
          'iat': a.iat,
          'exp': a.exp,
        });
      }
    } catch (_) {
      // silent; will retry next tick or when online
    } finally {
      _busy = false;
    }
  }

  Future<bool> _isOnline() async {
    final status = await Connectivity().checkConnectivity();
    return _isOnlineFrom(status);
  }

  bool _isOnlineFrom(dynamic status) {
    // Handles both ConnectivityResult and Set<ConnectivityResult>
    if (status is Iterable) {
      return status.any((s) => s.toString() != 'ConnectivityResult.none');
    }
    return status.toString() != 'ConnectivityResult.none';
  }
}

