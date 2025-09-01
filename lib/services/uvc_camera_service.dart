import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UvcCameraService {
  UvcCameraService._internal();
  static final UvcCameraService instance = UvcCameraService._internal();

  final UVCCameraController _controller = UVCCameraController();
  UVCCameraController get controller => _controller;

  bool _isOpened = false;
  bool get isOpened => _isOpened;

  bool _isCapturing = false;
  DateTime? _openedAt;
  bool _initialized = false;
  bool _cameraInitialized = false;
  Future<void>? _openOp;
  DateTime _nextRetryAt = DateTime.fromMillisecondsSinceEpoch(0);
  Duration _retryBackoff = const Duration(seconds: 3);
  final ValueNotifier<bool> previewVisible = ValueNotifier<bool>(false);

  void togglePreview() {
    final newVal = !previewVisible.value;
    previewVisible.value = newVal;
    if (newVal) {
      unawaited(ensureOpen());
    }
  }

  void showPreview() {
    if (!previewVisible.value) {
      previewVisible.value = true;
      unawaited(ensureOpen());
    }
  }

  void hidePreview() {
    if (previewVisible.value) previewVisible.value = false;
  }

  // Expose best-effort DCIM sweep publicly
  Future<void> sweepDcimIfNeeded() => _sweepDcimIfNeeded();

  void initialize() {
    if (_initialized) return;
    _initialized = true;
    _controller.cameraStateCallback = (state) {
      debugPrint('[UvcCameraService] state=$state');
      _isOpened = state == UVCCameraState.opened;
      if (_isOpened && _openedAt == null) {
        _openedAt = DateTime.now();
      }
      // Auto-recover on disconnect
      if (!_isOpened) {
        // schedule a debounced reopen with backoff
        final now = DateTime.now();
        if (now.isAfter(_nextRetryAt)) {
          _nextRetryAt = now.add(_retryBackoff);
          Future.delayed(const Duration(milliseconds: 800), () {
            unawaited(ensureOpen());
          });
        }
      } else {
        // reset backoff on success
        _retryBackoff = const Duration(seconds: 3);
      }
    };
    _controller.msgCallback = (msg) {
      debugPrint('[UvcCameraService] msg=$msg');
    };
    // Schedule DCIM cleanup best-effort
    Future.microtask(() => _sweepDcimIfNeeded());
  }

  Future<void> ensureOpen() async {
    initialize();
    if (_openOp != null) {
      return _openOp;
    }
    final completer = Completer<void>();
    _openOp = completer.future;
    try {
      if (!_cameraInitialized) {
        try {
          await _controller.initializeCamera();
          _cameraInitialized = true;
          debugPrint('[UvcCameraService] controller initialized');
        } catch (e) {
          // If already initialized or transient, continue
          debugPrint('[UvcCameraService] initializeCamera error: $e');
        }
      }
      if (!_isOpened) {
        try {
          await _controller.openUVCCamera();
          _openedAt = DateTime.now();
          _isOpened = true;
          debugPrint('[UvcCameraService] camera opened');
        } catch (e) {
          debugPrint('[UvcCameraService] open failed: $e');
          // increase backoff up to 10s
          final next = _retryBackoff + const Duration(seconds: 2);
          _retryBackoff = next > const Duration(seconds: 10)
              ? const Duration(seconds: 10)
              : next;
        }
      }
    } finally {
      if (!completer.isCompleted) completer.complete();
      _openOp = null;
    }
  }

  Future<String?> takePicture({int width = 640, int height = 480}) async {
    debugPrint('[UvcCameraService] Start takePicture');
    await ensureOpen();
    if (!_isOpened) return null;

    // Wait a short time after open to ensure buffer is ready
    final openedAgo = _openedAt == null
        ? const Duration(seconds: 0)
        : DateTime.now().difference(_openedAt!);
    if (openedAgo < const Duration(milliseconds: 700)) {
      await Future.delayed(const Duration(milliseconds: 500));
    }

    if (_isCapturing) return null;
    _isCapturing = true;
    try {
      // Some plugins accept target size via view; capture keeps sensor size.
      // We rely on the preview view fixed at 640x480 in the host.
      final path = await _controller.takePicture();
      debugPrint('[UvcCameraService] Finished takePicture');
      return path;
    } catch (e) {
      debugPrint('[UvcCameraService] takePicture failed: $e');
      return null;
    } finally {
      _isCapturing = false;
    }
  }

  Future<void> _sweepDcimIfNeeded() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final last = prefs.getInt('dcim_sweep_last') ?? 0;
      final lastDt = DateTime.fromMillisecondsSinceEpoch(last);
      if (DateTime.now().difference(lastDt) < const Duration(hours: 6)) {
        return;
      }
      int removed = 0;
      for (final path in const [
        '/storage/emulated/0/DCIM/Camera',
        '/sdcard/DCIM/Camera',
      ]) {
        final dir = Directory(path);
        if (!await dir.exists()) continue;
        try {
          final re = RegExp(r'^IMG_\d+\.jpg$', caseSensitive: false);
          final entries = await dir.list(followLinks: false).toList();
          for (final e in entries) {
            if (e is! File) continue;
            final name = e.uri.pathSegments.isNotEmpty
                ? e.uri.pathSegments.last
                : e.path.split('/').last;
            if (!re.hasMatch(name)) continue;
            try {
              await e.delete();
              removed++;
            } catch (_) {}
          }
        } catch (_) {}
      }
      if (removed > 0) {
        debugPrint('[UvcCameraService] LGPD DCIM sweep removed $removed photos');
      }
      await prefs.setInt('dcim_sweep_last', DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      debugPrint('[UvcCameraService] DCIM sweep error: $e');
    }
  }
}
