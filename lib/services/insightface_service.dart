import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'uvc_camera_service.dart';

/// InsightFaceService
///
/// Flutter facade for Android InspireFace SDK via MethodChannel.
/// On non-Android platforms, returns a stub empty result.
class InsightFaceService {
  InsightFaceService._();
  static final instance = InsightFaceService._();

  static const MethodChannel _ch = MethodChannel('com.seemidia/insightface');
  bool _initialized = false;

  Future<bool> ensureInitialized() async {
    if (!Platform.isAndroid) return false;
    if (_initialized) return true;
    try {
      final ok = await _ch.invokeMethod<bool>('init') ?? false;
      _initialized = ok;
      return ok;
    } catch (_) {
      return false;
    }
  }

  /// Analyze a local image file and return demographics summary.
  /// Returns a map like:
  /// {
  ///   "gender": {"Woman": 4, "Man": 4},
  ///   "men": 4, "women": 4, "total": 8,
  ///   "age": {"max": 59, "min": 27, "average": 39},
  ///   "method": "InsightFace"
  /// }
  Future<Map<String, dynamic>> analyzeImage(File file) async {
    if (!await ensureInitialized()) {
      return _emptyResult();
    }
    try {
      final Map<dynamic, dynamic>? res = await _ch.invokeMethod('analyze', {
        'path': file.path,
      });
      if (res == null) return _emptyResult();
      return Map<String, dynamic>.from(res);
    } catch (e) {
      if (kDebugMode) {
        print('[InsightFaceService] analyzeImage error: $e');
      }
      return _emptyResult();
    }
  }

  /// Convenience: capture a photo via UVC and analyze.
  Future<Map<String, dynamic>> captureAndAnalyze({int width = 640, int height = 480}) async {
    try {
      final path = await UvcCameraService.instance.takePicture(width: width, height: height);
      if (path == null) return _emptyResult();
      final file = File(path);
      if (!await file.exists()) return _emptyResult();
      return analyzeImage(file);
    } catch (e) {
      if (kDebugMode) {
        print('[InsightFaceService] captureAndAnalyze error: $e');
      }
      return _emptyResult();
    }
  }

  Map<String, dynamic> _emptyResult() => {
        'gender': {
          'Woman': 0,
          'Man': 0,
        },
        'men': 0,
        'women': 0,
        'total': 0,
        'age': {
          'max': 0,
          'min': 0,
          'average': 0,
        },
        'method': 'InsightFace',
      };
}

