import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:ultralytics_yolo/ultralytics_yolo.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_performance/firebase_performance.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:path/path.dart' as p;

import 'display_log_service.dart';
// import 'api_service.dart'; // comentado pois não está sendo usado
import 'storage_service.dart';

class BackgroundDetectionService {
  BackgroundDetectionService._internal();
  static final BackgroundDetectionService instance =
      BackgroundDetectionService._internal();

  YOLO? _yolo;
  bool _loading = false;
  String? _modelPath;

  final List<_Job> _queue = [];
  static const int _priorityThreshold = 10; // fila "muito cheia"
  static const int _maxQueue = 30; // limite duro de fila
  bool _processing = false;
  bool _recovered = false;

  Future<Directory> _queueDir() async {
    final dir = await getApplicationDocumentsDirectory();
    final d = Directory('${dir.path}/pending_detections');
    if (!await d.exists()) await d.create(recursive: true);
    return d;
  }

  Future<Directory> _photoDir() async {
    final d = Directory('${(await _queueDir()).path}/photos');
    if (!await d.exists()) await d.create(recursive: true);
    return d;
  }

  Future<File> _jobMetaFile(String captureId) async {
    final d = await _queueDir();
    return File('${d.path}/$captureId.json');
  }

  Future<File> _persistPhoto(File src, String captureId) async {
    final photos = await _photoDir();
    final parts = src.path.split('.');
    final ext = parts.isNotEmpty ? parts.last : 'jpg';
    final dst = File('${photos.path}/$captureId.$ext');
    try {
      return await src.rename(dst.path);
    } catch (_) {
      try {
        final copied = await src.copy(dst.path);
        // best-effort: remove original in DCIM to avoid gallery buildup
        try {
          if (await src.exists()) {
            await src.delete();
          }
          // Sweep residual plugin files in the same DCIM directory (LGPD)
          unawaited(_sweepDcimResiduals(File(src.path).parent));
        } catch (_) {}
        return copied;
      } catch (e) {
        debugPrint('[BackgroundDetection] Failed to persist photo: $e');
        return src; // fallback
      }
    }
  }

  Future<void> _sweepDcimResiduals(Directory dcimDir) async {
    try {
      final re = RegExp(r'^IMG_\d{17}\.jpg$');
      final now = DateTime.now();
      final entries = dcimDir
          .listSync(followLinks: false)
          .whereType<File>()
          .toList();
      int removed = 0;
      for (final f in entries) {
        final name = f.uri.pathSegments.isNotEmpty
            ? f.uri.pathSegments.last
            : f.path.split('/').last;
        if (!re.hasMatch(name)) continue;
        // Skip extremely recent files (< 60s) to avoid racing with MediaScanner
        try {
          final stat = await f.stat();
          if (now.difference(stat.changed) < const Duration(seconds: 60)) {
            continue;
          }
        } catch (_) {}
        try {
          await f.delete();
          removed++;
        } catch (_) {}
      }
      if (removed > 0) {
        debugPrint(
          '[BackgroundDetection] LGPD sweep removed $removed residual DCIM photos',
        );
      }
    } catch (e) {
      debugPrint('[BackgroundDetection] LGPD sweep error: $e');
    }
  }

  Future<void> _saveJobMeta(_Job job) async {
    final f = await _jobMetaFile(job.captureId);
    final data = {
      'captureId': job.captureId,
      'imagePath': job.imageFile.path,
      'body': job.body,
      'isAd': job.isAd,
    };
    await f.writeAsString(json.encode(data), flush: true);
  }

  Future<void> _deleteJobMeta(String captureId) async {
    try {
      final f = await _jobMetaFile(captureId);
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }

  Future<void> _recoverPending() async {
    if (_recovered) return;
    _recovered = true;
    try {
      final d = await _queueDir();
      final files = d
          .listSync()
          .whereType<File>()
          .where((f) => f.path.endsWith('.json'))
          .toList();
      if (files.isEmpty) return;
      final ads = <_Job>[];
      final news = <_Job>[];
      for (final f in files) {
        try {
          final raw = await f.readAsString();
          final map = json.decode(raw) as Map<String, dynamic>;
          final captureId = (map['captureId'] ?? '') as String;
          final imagePath = (map['imagePath'] ?? '') as String;
          final body = Map<String, dynamic>.from(map['body'] as Map);
          final isAd = map['isAd'] == true || (body['type'] == 'ADVERTISEMENT');
          final img = File(imagePath);
          if (captureId.isEmpty || !await img.exists()) {
            unawaited(_deleteJobMeta(captureId));
            continue;
          }
          final job = _Job(captureId, img, body, isAd);
          if (isAd) {
            ads.add(job);
          } else {
            news.add(job);
          }
        } catch (e) {
          debugPrint('[BackgroundDetection] Failed to recover a job: $e');
        }
      }
      // Prioritize ads first on recovery
      _queue.insertAll(0, news);
      _queue.insertAll(0, ads);
      if (_queue.isNotEmpty && !_processing) {
        _processing = true;
        unawaited(_drainQueue());
      }
      debugPrint(
        '[BackgroundDetection] Recovered ${_queue.length} pending jobs',
      );
    } catch (e) {
      debugPrint('[BackgroundDetection] _recoverPending error: $e');
    }
  }

  Future<void> ensureLoaded() async {
    await _recoverPending();
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
    final cloned = Map<String, dynamic>.from(body);
    final String type = (cloned['type'] ?? '').toString();
    final bool isAd = type == 'ADVERTISEMENT';

    // Persist and enqueue asynchronously
    unawaited(() async {
      final persisted = await _persistPhoto(imageFile, captureId);
      final job = _Job(captureId, persisted, cloned, isAd);
      await _saveJobMeta(job);

      if (_queue.length >= _priorityThreshold && isAd) {
        _queue.insert(0, job);
      } else {
        _queue.add(job);
      }

      // Se estourar o limite, descartamos do final priorizando remoção de NEWS
      if (_queue.length > _maxQueue) {
        int removeIndex = -1;
        for (int i = _queue.length - 1; i >= 0; i--) {
          if (!_queue[i].isAd) {
            removeIndex = i;
            break;
          }
        }
        if (removeIndex == -1) removeIndex = _queue.length - 1;
        final removed = _queue.removeAt(removeIndex);
        // Limpa arquivo e meta do item descartado
        unawaited(() async {
          try {
            await _deleteJobMeta(removed.captureId);
          } catch (_) {}
          try {
            if (await removed.imageFile.exists()) {
              await removed.imageFile.delete();
            }
          } catch (_) {}
        }());
      }
      if (!_processing) {
        _processing = true;
        // Kick off processing without awaiting
        unawaited(_drainQueue());
      }
    }());
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
          final token = await StorageService.getAuthToken();
          if (token != null) {
            // await ApiService.post<Map<String, dynamic>>(
            //   '/display/log/device',
            //   job.body,
            //   (m) => m,
            //   headers: {
            //     'Authorization': 'Bearer $token',
            //     'ngrok-skip-browser-warning': 'true',
            //   },
            // );
          }
          await DisplayLogService.instance.createLog(identifier: job.captureId, body: job.body);
        } catch (_) {}
        // Ensure temp file is removed
        try {
          if (await job.imageFile.exists()) {
            await job.imageFile.delete();
          }
        } catch (_) {}
        unawaited(_deleteJobMeta(job.captureId));
      }
    }
    _processing = false;
  }

  Future<void> _processJob(_Job job) async {
    final bdTrace = FirebasePerformance.instance.newTrace('bd_job');
    await bdTrace.start();
    bdTrace.putAttribute('capture_id', job.captureId);
    final _typeAttr = (job.body['type'] ?? '').toString();
    if (_typeAttr.isNotEmpty) bdTrace.putAttribute('type', _typeAttr);
    await ensureLoaded();
    int peopleCount = 0;
    try {
      if (_yolo != null) {
        final swYolo = Stopwatch()..start();
        final Uint8List bytes = await job.imageFile.readAsBytes();
        final result = await _yolo!.predict(
          bytes,
          confidenceThreshold: 0.5,
          iouThreshold: 0.4,
        );
        swYolo.stop();
        try {
          bdTrace.incrementMetric('yolo_ms', swYolo.elapsedMilliseconds);
        } catch (_) {}
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

    job.body['people_count'] = peopleCount;

    if (peopleCount >= 0) {
      job.body['people_count'] = peopleCount;

      // InsightFace enrichment
      if (peopleCount == 0) {
        job.body['insightface'] = {
          'gender': {'Woman': 0, 'Man': 0},
          'men': 0,
          'women': 0,
          'total': 0,
          'age': {'max': 0, 'min': 0, 'average': 0},
        };
      } else {
        try {
          final swFace = Stopwatch()..start();
          final insight = await _fetchInsightface(job.imageFile);
          swFace.stop();
          try {
            bdTrace.incrementMetric('insight_ms', swFace.elapsedMilliseconds);
          } catch (_) {}
          job.body['insightface'] = insight;
        } catch (e, st) {
          debugPrint(
            '[BackgroundDetection] InsightFace request failed: $e\n$st',
          );
          // Intencionalmente não define insightface em erro (>0) para não mascarar falhas
        }
      }
    }

    // LGPD: log only metadata (no photo upload)
    try {
      final token = await StorageService.getAuthToken();
      if (token != null) {
        final swLog = Stopwatch()..start();
        // await ApiService.post<Map<String, dynamic>>(
        //   '/display/log/device',
        //   job.body,
        //   (m) => m,
        //   headers: {
        //     'Authorization': 'Bearer $token',
        //     'ngrok-skip-browser-warning': 'true',
        //   },
        // );
        swLog.stop();
        try {
          bdTrace.incrementMetric('log_ms', swLog.elapsedMilliseconds);
          bdTrace.putAttribute('people_count', peopleCount.toString());
        } catch (_) {}
      }
      debugPrint('[BackgroundDetection] Salvando log no Firebase (offline-capable): ${job.captureId}');
      await DisplayLogService.instance.createLog(identifier: job.captureId, body: job.body);
      debugPrint('[BackgroundDetection] Log salvo com sucesso (cache ou online): ${job.captureId}');
    } finally {
      // Clean up temporary photo to avoid retention
      try {
        if (await job.imageFile.exists()) {
          await job.imageFile.delete();
        }
      } catch (_) {}
      unawaited(_deleteJobMeta(job.captureId));
      await bdTrace.stop();
    }
  }

  Map<String, dynamic> _emptyInsightface(String method) => {
    'gender': {'Woman': 0, 'Man': 0},
    'men': 0,
    'women': 0,
    'total': 0,
    'age': {'max': 0, 'min': 0, 'average': 0},
    'method': method,
  };

  Future<Map<String, dynamic>> _fetchInsightface(File imageFile) async {
    final uri = Uri.parse(
      'https://vision-2057331207.us-central1.run.app/detect-insightface',
    );
    try {
      final request = http.MultipartRequest('POST', uri);
      final filename = p.basename(imageFile.path).isNotEmpty
          ? p.basename(imageFile.path)
          : 'capture.jpg';
      final ext = p.extension(filename).toLowerCase();
      http_parser.MediaType contentType;
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = http_parser.MediaType('image', 'jpeg');
          break;
        case '.png':
          contentType = http_parser.MediaType('image', 'png');
          break;
        case '.webp':
          contentType = http_parser.MediaType('image', 'webp');
          break;
        default:
          contentType = http_parser.MediaType('image', 'jpeg');
      }

      request.files.add(
        await http.MultipartFile.fromPath(
          'file',
          imageFile.path,
          filename: filename,
          contentType: contentType,
        ),
      );
      final streamed = await request.send().timeout(
        const Duration(seconds: 30),
      );
      final response = await http.Response.fromStream(
        streamed,
      ).timeout(const Duration(seconds: 30));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = json.decode(response.body);
        if (decoded is Map<String, dynamic>) {
          // Garante campo method, caso a API não retorne
          decoded.putIfAbsent('method', () => 'InsightFace');
          return decoded;
        }
        debugPrint(
          '[BackgroundDetection] InsightFace: unexpected response type',
        );
        return _emptyInsightface('invalid_response');
      } else {
        debugPrint(
          '[BackgroundDetection] InsightFace HTTP ${response.statusCode}: ${response.body}',
        );
        return _emptyInsightface('http_${response.statusCode}');
      }
    } on TimeoutException {
      return _emptyInsightface('timeout');
    } catch (e, st) {
      debugPrint('[BackgroundDetection] InsightFace error: $e\n$st');
      return _emptyInsightface('error');
    }
  }
}

class _Job {
  final String captureId;
  final File imageFile;
  final Map<String, dynamic> body;
  final bool isAd;
  _Job(this.captureId, this.imageFile, this.body, this.isAd);
}
