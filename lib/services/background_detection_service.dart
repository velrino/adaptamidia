import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:ultralytics_yolo/ultralytics_yolo.dart';

import 'photo_log_service.dart';
import 'display_log_service.dart';

class BackgroundDetectionService {
  BackgroundDetectionService._internal();
  static final BackgroundDetectionService instance =
      BackgroundDetectionService._internal();

  YOLO? _yolo;
  bool _loading = false;
  String? _modelPath;

  final List<_Job> _queue = [];
  bool _processing = false;

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

      _yolo = YOLO(
        modelPath: _modelPath!,
        task: YOLOTask.detect,
        useGpu: false,
      );
      await _yolo!.loadModel();
      debugPrint('[BackgroundDetection] YOLO loaded at $_modelPath');
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

  void enqueue({
    required String captureId,
    required File imageFile,
    required Map<String, dynamic> body,
  }) {
    _queue.add(_Job(captureId, imageFile, Map<String, dynamic>.from(body)));
    if (!_processing) {
      _processing = true;
      // Kick off processing without awaiting
      unawaited(_drainQueue());
    }
  }

  Future<void> _drainQueue() async {
    while (_queue.isNotEmpty) {
      final job = _queue.removeAt(0);
      try {
        await _processJob(job);
      } catch (e, st) {
        debugPrint('[BackgroundDetection] Job failed: $e\n$st');
        // Best-effort: log metadata without photo
        try {
          await DisplayLogService.instance
              .createLog(identifier: job.captureId, body: job.body);
        } catch (_) {}
        // Ensure temp file is removed
        try {
          if (await job.imageFile.exists()) {
            await job.imageFile.delete();
          }
        } catch (_) {}
      }
    }
    _processing = false;
  }

  Future<void> _processJob(_Job job) async {
    await ensureLoaded();
    int peopleCount = 0;
    try {
      if (_yolo != null) {
        final Uint8List bytes = await job.imageFile.readAsBytes();
        final result = await _yolo!.predict(
          bytes,
          confidenceThreshold: 0.5,
          iouThreshold: 0.4,
        );
        final detections = (result['detections'] as List<dynamic>? ?? [])
            .map((e) => YOLOResult.fromMap(e))
            .toList();
        peopleCount = detections
            .where((d) => d.className.toLowerCase() == 'person')
            .length;
        debugPrint(
          '[BackgroundDetection] capture=${job.captureId} people=$peopleCount',
        );
      }
    } catch (e, st) {
      debugPrint('[BackgroundDetection] Detection error: $e\n$st');
    }

    if (peopleCount >= 0) {
      job.body['people_count'] = peopleCount;
    }

    // LGPD: log only metadata (no photo upload)
    try {
      await DisplayLogService.instance
          .createLog(identifier: job.captureId, body: job.body);
    } finally {
      // Clean up temporary photo to avoid retention
      try {
        if (await job.imageFile.exists()) {
          await job.imageFile.delete();
        }
      } catch (_) {}
    }
  }
}

class _Job {
  final String captureId;
  final File imageFile;
  final Map<String, dynamic> body;
  _Job(this.captureId, this.imageFile, this.body);
}
