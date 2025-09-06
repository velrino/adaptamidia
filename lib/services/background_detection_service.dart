import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:ultralytics_yolo/ultralytics_yolo.dart';
import 'package:firebase_performance/firebase_performance.dart';

import 'display_log_service.dart';
import 'insightface_service.dart';
// import 'api_service.dart'; // comentado pois não está sendo usado
// import 'storage_service.dart';

class BackgroundDetectionService {
  BackgroundDetectionService._internal();
  static final BackgroundDetectionService instance =
      BackgroundDetectionService._internal();

  YOLO? _yolo;
  bool _loading = false;
  String? _modelPath;
  bool _yoloGpu = false;
  bool _gpuDelegateDisabled = false; // disable GPU after a runtime failure

  // Queue/persistence pipeline removed: now processing is immediate and in-memory.

  // Legacy recovery removed: no pending jobs maintained.

  Future<void> ensureLoaded() async {
    if (_yolo != null || _loading) return;
    _loading = true;
    try {
      final data = await rootBundle.load('assets/models/yolo11n.tflite');
      final bytes = data.buffer.asUint8List();
      final tmpDir = await getTemporaryDirectory();
      final file = File('${tmpDir.path}/yolo11n.tflite');
      await file.writeAsBytes(bytes, flush: true);
      _modelPath = file.path;

      // Prefer GPU delegate; fallback to CPU if unavailable
      try {
        _yolo = YOLO(
          modelPath: _modelPath!,
          task: YOLOTask.detect,
          useGpu: true,
        );
        await _yolo!.loadModel();
        _yoloGpu = true;
        debugPrint('[BackgroundDetection] YOLO loaded (GPU) at $_modelPath');
      } catch (e) {
        debugPrint('[BackgroundDetection] GPU load failed, falling back to CPU: $e');
        try { _yolo?.dispose(); } catch (_) {}
        _yolo = YOLO(
          modelPath: _modelPath!,
          task: YOLOTask.detect,
          useGpu: false,
        );
        await _yolo!.loadModel();
        _yoloGpu = false;
        debugPrint('[BackgroundDetection] YOLO loaded (CPU) at $_modelPath');
      }
    } catch (e) {
      debugPrint('[BackgroundDetection] Failed to load YOLO: $e');
    } finally {
      _loading = false;
    }
  }

  void dispose() {
    try {
      _yolo?.dispose();
    } catch (_) {}
    _yolo = null;
  }

  Future<Map<String, dynamic>> _predictWithGpuFallback(Uint8List bytes) async {
    try {
      return await _yolo!.predict(
        bytes,
        confidenceThreshold: 0.5,
        iouThreshold: 0.4,
      );
    } catch (e) {
      // If GPU path failed at runtime, switch to CPU and retry once
      final msg = e.toString();
      final looksGpuDelegateError = msg.contains('Failed to apply delegate') ||
          msg.contains('TfLiteGpuDelegate') ||
          msg.contains('OpenCL') ||
          msg.contains('delegate is not initialized');
      if (_yoloGpu && !_gpuDelegateDisabled && looksGpuDelegateError) {
        debugPrint('[BackgroundDetection] GPU runtime failure, falling back to CPU. Error: $msg');
        try { _yolo?.dispose(); } catch (_) {}
        _gpuDelegateDisabled = true;
        // Recreate YOLO on CPU
        _yolo = YOLO(
          modelPath: _modelPath!,
          task: YOLOTask.detect,
          useGpu: false,
        );
        await _yolo!.loadModel();
        _yoloGpu = false;
        // Retry once on CPU
        return await _yolo!.predict(
          bytes,
          confidenceThreshold: 0.5,
          iouThreshold: 0.4,
        );
      }
      rethrow;
    }
  }

  /// Process a single capture immediately, without persisting the image to disk.
  /// If [bytes] is provided and YOLO is available, runs detection and augments
  /// [body] with a computed `people_count`. Always logs via DisplayLogService.
  Future<void> processImmediate({
    required String captureId,
    required Map<String, dynamic> body,
    Uint8List? bytes,
    File? imageFile,
  }) async {
    final bdTrace = FirebasePerformance.instance.newTrace('bd_job_immediate');
    await bdTrace.start();
    try {
      bdTrace.putAttribute('capture_id', captureId);
      final typeAttr = (body['type'] ?? '').toString();
      if (typeAttr.isNotEmpty) bdTrace.putAttribute('type', typeAttr);

      await ensureLoaded();

      int peopleCount = 0;
      if (bytes != null && _yolo != null) {
        try {
          final swYolo = Stopwatch()..start();
          final result = await _predictWithGpuFallback(bytes);
          swYolo.stop();
          try { bdTrace.incrementMetric('yolo_ms', swYolo.elapsedMilliseconds); } catch (_) {}
          final detections = (result['detections'] as List<dynamic>? ?? [])
              .map((e) => YOLOResult.fromMap(e))
              .toList();
          peopleCount = detections
              .where((d) => d.className.toLowerCase() == 'person')
              .length;
        } catch (e, st) {
          debugPrint('[BackgroundDetection] Immediate YOLO failed (after fallback): $e\n$st');
        }
      }

      // Augment body with result
      body['people_count'] = peopleCount;

      // Optional: InsightFace using the same captured image (file), when available
      if (imageFile != null) {
        try {
          final swFace = Stopwatch()..start();
          final insight = await InsightFaceService.instance.analyzeImage(imageFile);
          swFace.stop();
          try { bdTrace.incrementMetric('insight_ms', swFace.elapsedMilliseconds); } catch (_) {}
          body['insightface'] = insight;
        } catch (e) {
          debugPrint('[BackgroundDetection] Immediate InsightFace failed: $e');
        }
      }

      // Save log (offline-capable)
      await DisplayLogService.instance.createLog(identifier: captureId, body: body);
    } catch (e) {
      debugPrint('[BackgroundDetection] processImmediate error: $e');
    } finally {
      try { await bdTrace.stop(); } catch (_) {}
      // Cleanup: ensure any provided imageFile is deleted
      try { if (imageFile != null && await imageFile.exists()) { await imageFile.delete(); } } catch (_) {}
    }
  }

  // Legacy queue-based job processing removed.

  /*
  // Legacy remote InsightFace (HTTP) — mantido comentado para referência futura
  Map<String, dynamic> _emptyInsightface(String method) => {
    'gender': {'Woman': 0, 'Man': 0},
    'men': 0,
    'women': 0,
    'total': 0,
    'age': {'max': 0, 'min': 0, 'average': 0},
    'method': method,
  };

  Future<Map<String, dynamic>> _fetchInsightface(File imageFile) async {
    // POST https://vision-.../detect-insightface (multipart/form-data)
    // Substituído por InsightFaceService (on-device). Manter como fallback se necessário.
    ...
  }
  */
}

// _Job class removed with legacy queue pipeline.
