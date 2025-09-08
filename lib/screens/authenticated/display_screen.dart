import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:seemidia/components/ad_video_layer.dart';
import '../../services/background_detection_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../services/storage_service.dart';
import '../../services/video_cache_service.dart';
import '../../services/image_cache_service.dart';
import '../../services/api_service.dart';
import '../../services/device_context_service.dart';
import '../../services/uvc_camera_service.dart';
import 'package:firebase_performance/firebase_performance.dart';
import '../../services/device_presence_service.dart';
import '../../services/token_refresh_service.dart';
import '../../services/app_update_service.dart';

class DisplayScreen extends StatefulWidget {
  final String unitId;

  const DisplayScreen({super.key, required this.unitId});

  @override
  State<DisplayScreen> createState() => _DisplayScreenState();
}

class _DisplayScreenState extends State<DisplayScreen> {
  List<dynamic> _contents = [];
  int _currentIndex = 0;
  Timer? _timer;
  bool _isLoading = true;
  bool _isPreparing = false;
  double _prepareProgress = 0.0;
  int _videoTotal = 0;
  int _videoDone = 0;
  int _imageTotal = 0;
  int _imageDone = 0;
  String? _error;
  Map<String, dynamic>? _unitData;
  Timer? _backgroundTimer;
  Timer? _updateTimer;
  Map<String, dynamic>? _infoData;
  // Analysis placeholders (reserved for NEWS analysis scheduling)
  Timer? _analysisTimer;
  Map<String, dynamic>? _pendingAnalysis;
  String? _pendingAnalysisForId;
  double? _usdBid;
  String? _weatherText;
  String? _weatherIcon;
  double? _weatherTempC;
  DateTime? _currentStartAt;
  int _currentDurationSecs = 0;
  bool _deviceIsLandscape = true;
  final GlobalKey<AdVideoLayerState> _adLayerKey =
      GlobalKey<AdVideoLayerState>();
  ImageProvider? _backdropProvider;
  String? _backdropId;
  double _backdropOpacity = 1.0;

  @override
  void initState() {
    super.initState();
    _enterFullScreen();
    // Start presence and background token refresh
    _announcePresence();
    _initDeviceConfig();
    _loadContent();
    WakelockPlus.enable();
    TokenRefreshService.instance.start();
    _scheduleAppUpdateChecks();
    // React immediately when RELEASE changes
    AppUpdateService.instance.startFirebaseReleaseListener();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(UvcCameraService.instance.ensureOpen());
      UvcCameraService.instance.hidePreview();
    });
  }

  Future<void> _initDeviceConfig() async {
    try {
      final config = await StorageService.getDeviceConfig();
      if (!mounted) return;
      setState(() {
        _deviceIsLandscape = config?.isLandscape ?? true;
      });
    } catch (_) {}
  }

  Future<void> _announcePresence() async {
    try {
      await DevicePresenceService.instance.start(currentScreen: 'DISPLAY');
    } catch (_) {}
  }

  void _scheduleAppUpdateChecks() {
    // First check shortly after startup to avoid competing with initial I/O
    Future.delayed(const Duration(seconds: 45), () {
      unawaited(AppUpdateService.instance.checkAndUpdateFromFirebase());
    });
    // Then check hourly
    _updateTimer?.cancel();
    _updateTimer = Timer.periodic(const Duration(hours: 1), (_) {
      unawaited(AppUpdateService.instance.checkAndUpdateFromFirebase());
    });
  }

  @override
  void dispose() {
    unawaited(_logCurrentDisplayFinished());
    try {
      BackgroundDetectionService.instance.dispose();
    } catch (_) {}
    _timer?.cancel();
    _backgroundTimer?.cancel();
    _updateTimer?.cancel();
    _analysisTimer?.cancel();
    _exitFullScreen();
    WakelockPlus.disable();
    TokenRefreshService.instance.stop();
    unawaited(DevicePresenceService.instance.stop());
    AppUpdateService.instance.stopFirebaseReleaseListener();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    unawaited(BackgroundDetectionService.instance.ensureLoaded());
  }

  void _enterFullScreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
  }

  Future<void> _fetchInfo() async {
    try {
      final token = await StorageService.getAuthToken();
      if (token == null) return;
      final res = await ApiService.get<Map<String, dynamic>>(
        '/display/unit/${widget.unitId}/info',
        (m) => m,
        headers: {'Authorization': 'Bearer $token'},
      );
      if (!res.success || res.data == null) return;
      final data = res.data!;
      if (!mounted) return;
      setState(() {
        _infoData = data;
        _usdBid = (data['currency'] != null)
            ? (data['currency']['bid'] as num?)?.toDouble()
            : null;
        _weatherText = (data['weather'] != null)
            ? (data['weather']['text'] as String?)
            : null;
        final rawIcon = (data['weather'] != null)
            ? (data['weather']['icon'] as String?)
            : null;
        String? normalizedIcon = rawIcon;
        if (normalizedIcon != null &&
            normalizedIcon.isNotEmpty &&
            normalizedIcon.startsWith('//')) {
          normalizedIcon = 'https:$normalizedIcon';
        }
        _weatherIcon = normalizedIcon;
        _weatherTempC = (data['weather'] != null)
            ? (data['weather']['temperature_c'] as num?)?.toDouble()
            : null;
      });
    } catch (e) {
      // Silencioso: se offline, apenas mantém último valor
    }
  }

  void _exitFullScreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  Future<void> _loadContent() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final token = await StorageService.getAuthToken();
      if (token == null) {
        throw Exception('No auth token');
      }
      final config = await StorageService.getDeviceConfig();
      final isLandscape = config?.isLandscape ?? _deviceIsLandscape;
      final res = await ApiService.get<Map<String, dynamic>>(
        '/display/unit/${widget.unitId}',
        (m) => m,
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.success && res.data != null) {
        final data = res.data!;
        debugPrint('Response status: 200');
        debugPrint('Response data: ${json.encode(data).substring(0, 200)}...');

        if (data['data'] != null && data['data'] is List) {
          // Pre-cache videos
          for (var content in data['data']) {
            if (content['type'] == 'ADVERTISEMENT' && content['ads'] != null) {
              final dynamic ads = content['ads'];
              String? videoUrl = isLandscape
                  ? (ads['source_landscape'] as String?)
                  : (ads['source_portrait'] as String?);
              videoUrl ??=
                  (ads['source_landscape'] as String?) ??
                  (ads['source_portrait'] as String?);
              if (videoUrl != null) {
                debugPrint('🔥 Pre-caching video: $videoUrl');
                VideoCacheService.instance.getVideoFromCache(videoUrl);
              }
            }
          }

          setState(() {
            _unitData = data['unit'];
            _contents = data['data'];
            _isLoading = false;
          });

          if (_contents.isNotEmpty) {
            unawaited(_prepareAssetsAndStart());
            _startBackgroundSync();
            unawaited(_fetchInfo());
          }
        } else {
          throw Exception('Invalid response format - no data field found');
        }
      } else {
        throw Exception('Failed to load content');
      }
    } catch (e) {
      debugPrint('❌ Error loading content: $e');
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _prepareAssetsAndStart() async {
    final trace = FirebasePerformance.instance.newTrace('prepare_assets');
    await trace.start();
    if (!mounted) return;
    setState(() {
      _isPreparing = true;
      _prepareProgress = 0.0;
      _videoTotal = 0;
      _videoDone = 0;
      _imageTotal = 0;
      _imageDone = 0;
    });

    try {
      final videoUrls = <String>[];
      final imageUrls = <String>[];

      final config = await StorageService.getDeviceConfig();
      final isLandscape = config?.isLandscape ?? _deviceIsLandscape;
      for (final c in _contents) {
        if (c['type'] == 'ADVERTISEMENT' && c['ads'] != null) {
          final ads = c['ads'];
          String? v = isLandscape
              ? (ads['source_landscape'] as String?)
              : (ads['source_portrait'] as String?);
          v ??=
              (ads['source_landscape'] as String?) ??
              (ads['source_portrait'] as String?);
          if (v is String && v.isNotEmpty) videoUrls.add(v);
        } else if (c['type'] == 'NEWS' && c['news'] != null) {
          final img = c['news']['image'];
          if (img is String && img.isNotEmpty) imageUrls.add(img);
        }
      }

      final videoSet = videoUrls.toSet();
      final imageSet = imageUrls.toSet();
      _videoTotal = videoSet.length;
      _imageTotal = imageSet.length;

      await Future.wait([
        VideoCacheService.instance.cleanupCache(keepUrls: videoSet),
        ImageCacheService.instance.cleanupOld(keepUrls: imageSet),
      ]);

      final total = (videoSet.length + imageSet.length).clamp(1, 1 << 30);
      int done = 0;
      void tick() {
        if (!mounted) return;
        setState(() {
          _prepareProgress = done / total;
        });
      }

      Future<void> imageFuture = () async {
        if (imageUrls.isEmpty) return;
        await ImageCacheService.instance.preloadAll(
          imageUrls,
          concurrency: 3,
          onProgress: (p) {
            _imageDone = (p * _imageTotal).round();
            done = _imageDone + _videoDone;
            tick();
          },
        );
      }();

      Future<void> videoFuture = () async {
        if (videoUrls.isEmpty) return;
        await VideoCacheService.instance.preloadVideos(
          videoUrls,
          onProgress: (d, t) {
            _videoDone = d;
            done = _imageDone + _videoDone;
            tick();
          },
        );
      }();

      await Future.wait([imageFuture, videoFuture]);

      final filtered = <dynamic>[];
      for (final c in _contents) {
        if (c['type'] == 'ADVERTISEMENT' && c['ads'] != null) {
          final ads = c['ads'];
          String? v = isLandscape
              ? (ads['source_landscape'] as String?)
              : (ads['source_portrait'] as String?);
          v ??=
              (ads['source_landscape'] as String?) ??
              (ads['source_portrait'] as String?);
          if (v is String && v.isNotEmpty) {
            final file = await VideoCacheService.instance.getVideoFromCache(v);
            if (file != null) filtered.add(c);
          }
        } else if (c['type'] == 'NEWS' && c['news'] != null) {
          final img = c['news']['image'];
          if (img is String && img.isNotEmpty) {
            if (await ImageCacheService.instance.isCached(img)) {
              filtered.add(c);
            }
          }
        }
      }

      if (mounted) {
        setState(() {
          if (filtered.isNotEmpty) {
            _contents = filtered;
            _currentIndex = 0;
          }
        });
      }
    } catch (e) {
      debugPrint('⚠️ Erro no pré-carregamento: $e');
    } finally {
      if (!mounted) return;
      setState(() {
        _isPreparing = false;
        _prepareProgress = 1.0;
      });
      await trace.stop();
      unawaited(_startContent());
    }
  }

  Future<void> _startContent() async {
    if (_contents.isEmpty) return;

    _timer?.cancel();

    final content = _contents[_currentIndex];
    final type = content['type'];

    debugPrint('🎬 Starting content: $type at index $_currentIndex');

    int duration = 10;
    if (type == 'ADVERTISEMENT' && content['ads'] != null) {
      duration = content['ads']['seconds'] ?? 10;
    }

    _currentStartAt = DateTime.now();
    _currentDurationSecs = duration;

    if (type == 'ADVERTISEMENT' && content['ads'] != null) {
      final ads = content['ads'];
      String? v = _deviceIsLandscape
          ? (ads['source_landscape'] as String?)
          : (ads['source_portrait'] as String?);
      v ??=
          (ads['source_landscape'] as String?) ??
          (ads['source_portrait'] as String?);
      if (v is String && v.isNotEmpty) {
        // Esconde o backdrop imediatamente
        if (mounted) {
          setState(() {
            _backdropOpacity = 0.0;
            _backdropProvider = null;
            _backdropId = null;
          });
        }

        // Play current ad imediatamente (sem delay)
        final videoUrl = v;
        final file = await VideoCacheService.instance.getVideoFromCache(
          videoUrl,
        );
        if (file != null) {
          await _adLayerKey.currentState?.playFile(file);
        }

        // Prepare next ad
        final nextIndex = (_currentIndex + 1) % _contents.length;
        final next = _contents[nextIndex];
        if (next['type'] == 'ADVERTISEMENT' && next['ads'] != null) {
          final nads = next['ads'];
          String? nv = _deviceIsLandscape
              ? (nads['source_landscape'] as String?)
              : (nads['source_portrait'] as String?);
          nv ??=
              (nads['source_landscape'] as String?) ??
              (nads['source_portrait'] as String?);
          if (nv is String && nv.isNotEmpty) {
            VideoCacheService.instance.getVideoFromCache(nv).then((nfile) {
              if (nfile != null) {
                _adLayerKey.currentState?.prepareNext(nfile);
              }
            });
          }
        }
      }
    } else {
      // NEWS: garantir backdrop pronto
      unawaited(_adLayerKey.currentState?.hide());
      try {
        final news = content['news'];
        final String imageUrl = (news?['image'] as String?) ?? '';
        if (imageUrl.isNotEmpty) {
          if (mounted) {
            setState(() {
              _backdropOpacity = 0.0;
            });
          }
          final file =
              await ImageCacheService.instance.getFileFromCache(imageUrl) ??
              await ImageCacheService.instance.prefetch(imageUrl);
          if (file != null && mounted) {
            final mq = MediaQuery.of(context);
            final targetW = (mq.size.width * mq.devicePixelRatio).round();
            final targetH = (mq.size.height * mq.devicePixelRatio).round();
            final provider = ResizeImage(
              FileImage(file),
              width: targetW,
              height: targetH,
            );
            await precacheImage(provider, context);
            if (mounted) {
              setState(() {
                _backdropProvider = provider;
                _backdropId = file.path;
                _backdropOpacity = 1.0;
              });
            }
          }
        }
      } catch (_) {}
    }

    unawaited(_prepareNextContent());

    _timer = Timer(Duration(seconds: duration), () {
      if (!mounted) return;
      _nextContent();
    });
  }

  Future<void> _prepareNextContent() async {
    if (_contents.isEmpty) return;
    final nextIndex = (_currentIndex + 1) % _contents.length;
    final next = _contents[nextIndex];
    final isNextAd = next['type'] == 'ADVERTISEMENT' && next['ads'] != null;
    final isNextNews = next['type'] == 'NEWS' && next['news'] != null;

    if (isNextAd) {
      final nads = next['ads'];
      String? nv = _deviceIsLandscape
          ? (nads['source_landscape'] as String?)
          : (nads['source_portrait'] as String?);
      nv ??=
          (nads['source_landscape'] as String?) ??
          (nads['source_portrait'] as String?);
      if (nv is String && nv.isNotEmpty) {
        final file = await VideoCacheService.instance.getVideoFromCache(nv);
        if (file != null) {
          // Aguarda um momento para não competir com o vídeo atual
          await Future.delayed(const Duration(milliseconds: 500));
          // Prepara o próximo vídeo
          await _adLayerKey.currentState?.prepareNext(file);
        }
      }
    } else if (isNextNews) {
      final img = next['news']['image'];
      if (img is String && img.isNotEmpty && mounted) {
        try {
          final file =
              await ImageCacheService.instance.getFileFromCache(img) ??
              await ImageCacheService.instance.prefetch(img);
          if (file != null) {
            final mq = MediaQuery.of(context);
            final targetW = (mq.size.width * mq.devicePixelRatio).round();
            final targetH = (mq.size.height * mq.devicePixelRatio).round();
            final provider = ResizeImage(
              FileImage(file),
              width: targetW,
              height: targetH,
            );
            unawaited(precacheImage(provider, context));
          }
        } catch (_) {}
      }
    }
  }

  void _startBackgroundSync() {
    _backgroundTimer?.cancel();
    _backgroundTimer = Timer.periodic(const Duration(minutes: 10), (_) {
      _backgroundRefresh();
      _fetchInfo();
    });
  }

  Future<void> _backgroundRefresh() async {
    try {
      final token = await StorageService.getAuthToken();
      if (token == null) return;
      final config = await StorageService.getDeviceConfig();
      final isLandscape = config?.isLandscape ?? _deviceIsLandscape;
      final res = await ApiService.get<Map<String, dynamic>>(
        '/display/unit/${widget.unitId}',
        (m) => m,
        headers: {'Authorization': 'Bearer $token'},
      );
      if (!res.success || res.data == null) return;
      final data = res.data!;
      if (data['data'] == null || data['data'] is! List) return;

      final newContents = List<dynamic>.from(data['data']);

      final newVideos = <String>[];
      final newImages = <String>[];
      for (final c in newContents) {
        if (c['type'] == 'ADVERTISEMENT' && c['ads'] != null) {
          final ads = c['ads'];
          String? v = isLandscape
              ? (ads['source_landscape'] as String?)
              : (ads['source_portrait'] as String?);
          v ??=
              (ads['source_landscape'] as String?) ??
              (ads['source_portrait'] as String?);
          if (v is String && v.isNotEmpty) newVideos.add(v);
        } else if (c['type'] == 'NEWS' && c['news'] != null) {
          final img = c['news']['image'];
          if (img is String && img.isNotEmpty) newImages.add(img);
        }
      }

      final videoSet = newVideos.toSet();
      final imageSet = newImages.toSet();

      await Future.wait([
        VideoCacheService.instance.cleanupCache(keepUrls: videoSet),
        ImageCacheService.instance.cleanupOld(keepUrls: imageSet),
      ]);

      await Future.wait([
        if (imageSet.isNotEmpty)
          ImageCacheService.instance.preloadAll(
            imageSet.toList(),
            concurrency: 6,
          ),
        if (videoSet.isNotEmpty)
          VideoCacheService.instance.preloadVideos(videoSet.toList()),
      ]);

      final filtered = <dynamic>[];
      for (final c in newContents) {
        if (c['type'] == 'ADVERTISEMENT' && c['ads'] != null) {
          final ads = c['ads'];
          String? v = isLandscape
              ? (ads['source_landscape'] as String?)
              : (ads['source_portrait'] as String?);
          v ??=
              (ads['source_landscape'] as String?) ??
              (ads['source_portrait'] as String?);
          if (v is String && v.isNotEmpty) {
            final file = await VideoCacheService.instance.getVideoFromCache(v);
            if (file != null) filtered.add(c);
          }
        } else if (c['type'] == 'NEWS' && c['news'] != null) {
          final img = c['news']['image'];
          if (img is String && img.isNotEmpty) {
            if (await ImageCacheService.instance.isCached(img)) {
              filtered.add(c);
            }
          }
        }
      }

      if (!mounted || filtered.isEmpty) return;

      setState(() {
        _contents = filtered;
        if (_currentIndex >= _contents.length) {
          _currentIndex = 0;
        }
      });
    } catch (e) {
      debugPrint('⚠️ Erro no background refresh: $e');
    }
  }

  void _nextContent() {
    debugPrint(
      '[DisplayScreen] _nextContent called. Will log current display as finished. index=$_currentIndex total=${_contents.length}',
    );
    unawaited(_logCurrentDisplayFinished());

    // Transição imediata (sem delay)
    if (!mounted) return;
    setState(() {
      _currentIndex = (_currentIndex + 1) % _contents.length;
    });
    unawaited(_startContent());
  }

  Future<void> _logCurrentDisplayFinished() async {
    debugPrint('[DisplayScreen] _logCurrentDisplayFinished invoked');
    if (_contents.isEmpty) {
      debugPrint('[DisplayScreen] No contents. Skip logging.');
      return;
    }
    final content = _contents[_currentIndex];
    final isAd = content['type'] == 'ADVERTISEMENT' && content['ads'] != null;
    final isNews = content['type'] == 'NEWS' && content['news'] != null;
    if (!isAd && !isNews) {
      debugPrint(
        '[DisplayScreen] Current content is neither ADS nor NEWS. type=${content['type']} Skip logging.',
      );
      return;
    }

    final currentId = isAd
        ? (content['ads']['_id']?.toString() ?? '')
        : (content['news']['_id']?.toString() ?? '');
    if (currentId.isEmpty) {
      debugPrint('[DisplayScreen] currentId empty. Skip logging.');
      return;
    }
    final captureId = DateTime.now().millisecondsSinceEpoch.toString();

    final endAt = DateTime.now();
    final startAt =
        _currentStartAt ??
        endAt.subtract(Duration(seconds: _currentDurationSecs));
    debugPrint(
      '[DisplayScreen] Logging $currentId type=${isAd ? 'ADVERTISEMENT' : 'NEWS'} startAt=$startAt endAt=$endAt',
    );

    final deviceId = await StorageService.getOrCreateDeviceId();
    debugPrint('[DisplayScreen] deviceId=$deviceId');

    final deviceContext = await DeviceContextService.gather();

    final body = <String, dynamic>{
      'identifier': captureId,
      'id': currentId,
      'local': _unitData,
      'type': isAd ? 'ADVERTISEMENT' : 'NEWS',
      'status': 'FINISHED',
      'start_at': startAt.toIso8601String(),
      'end_at': endAt.toIso8601String(),
      'device_id': deviceId,
      'device_context': deviceContext,
    };

    {
      try {
        UvcCameraService.instance.hidePreview();
        final tmpPath = await UvcCameraService.instance.takePicture(
          width: 480,
          height: 360,
        );
        if (tmpPath != null) {
          final file = File(tmpPath);
          debugPrint(
            '[DisplayScreen] Captured photo for $captureId at $tmpPath',
          );
          final bytes = await file.readAsBytes();
          await BackgroundDetectionService.instance.processImmediate(
            captureId: captureId,
            body: body,
            bytes: bytes,
            imageFile: file,
          );
          return;
        } else {
          debugPrint(
            '[DisplayScreen] takePicture returned null, fallback to log without photo',
          );
        }
      } catch (e) {
        debugPrint('[DisplayScreen] Photo capture failed: $e');
      } finally {
        // UvcCameraService.instance.showPreview();
      }
    }

    debugPrint('[DisplayScreen] No camera available, logging without photo');
    try {
      await BackgroundDetectionService.instance.processImmediate(
        captureId: captureId,
        body: body,
        bytes: null,
      );
      debugPrint('[DisplayScreen] Log saved successfully (no photo)');
    } catch (e) {
      debugPrint('[DisplayScreen] Failed to save log: $e');
    }
  }

  Widget _buildContent() {
    if (_contents.isEmpty) {
      return const Center(
        child: Text(
          'Sem conteúdo disponível',
          style: TextStyle(color: Colors.white, fontSize: 32),
        ),
      );
    }

    final content = _contents[_currentIndex];
    final type = content['type'];

    if (type == 'NEWS' && content['news'] != null) {
      return _buildNews(content['news']);
    } else if (type == 'ADVERTISEMENT' && content['ads'] != null) {
      return _buildAdvertisement(content['ads']);
    }

    return Container();
  }

  Widget _buildNews(Map<String, dynamic> news) {
    final imageUrl = news['image'] ?? '';
    final title = news['title'] ?? '';
    final description = news['description'] ?? '';
    final sourceName = news['source_name'] ?? '';
    final author = news['author'] ?? '';
    final mq = MediaQuery.of(context);
    final memW = (mq.size.width * mq.devicePixelRatio).round();
    final memH = (mq.size.height * mq.devicePixelRatio).round();
    final shortest = mq.size.shortestSide;
    final scale = (shortest / 800).clamp(1.0, 1.8);

    final hasCenter = _weatherIcon != null || _weatherTempC != null;
    final leftCurrency = _usdBid != null ? _usdBid!.toStringAsFixed(2) : '--';

    if (_backdropProvider == null) {
      return const SizedBox.shrink();
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned(
          bottom: 24,
          left: 24,
          right: 24,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withOpacity(0.8),
                  Colors.black.withOpacity(0.6),
                ],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.5),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
              border: Border.all(
                color: Colors.white.withOpacity(0.1),
                width: 1,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                IntrinsicHeight(
                  child: Row(
                    children: [
                      Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(15),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(15),
                          child: Image.asset(
                            'assets/images/logo-flex.png',
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Colors.grey[800],
                                child: const Icon(
                                  Icons.image,
                                  color: Colors.white54,
                                  size: 80,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      Container(
                        width: 1,
                        height: double.infinity,
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        color: Colors.white.withOpacity(0.2),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              title,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: (36 * scale),
                                fontWeight: FontWeight.bold,
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              description,
                              style: TextStyle(
                                color: Colors.grey[300],
                                fontSize: (26 * scale),
                                height: 1.3,
                              ),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (sourceName.isNotEmpty || author.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(
                                    Icons.newspaper,
                                    color: Colors.grey[400],
                                    size: (18 * scale),
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      [
                                        sourceName,
                                        author,
                                      ].where((s) => s.isNotEmpty).join(' • '),
                                      style: TextStyle(
                                        color: Colors.grey[400],
                                        fontSize: (18 * scale),
                                        fontStyle: FontStyle.italic,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 8),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.only(top: 12),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: Colors.white.withOpacity(0.15),
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.attach_money,
                              color: Colors.white70,
                              size: (20 * scale),
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                leftCurrency,
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: (20 * scale),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Center(
                          child: hasCenter
                              ? Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (_weatherIcon != null)
                                      CachedNetworkImage(
                                        imageUrl: _weatherIcon!,
                                        width: (28 * scale),
                                        height: (28 * scale),
                                        fit: BoxFit.contain,
                                        fadeInDuration: const Duration(
                                          milliseconds: 200,
                                        ),
                                        fadeOutDuration: const Duration(
                                          milliseconds: 200,
                                        ),
                                        errorWidget: (ctx, url, err) => Icon(
                                          Icons.wb_sunny,
                                          color: Colors.white70,
                                          size: (22 * scale),
                                        ),
                                      ),
                                    if (_weatherIcon != null &&
                                        _weatherTempC != null)
                                      SizedBox(width: 8),
                                    if (_weatherTempC != null)
                                      Text(
                                        '${_weatherTempC!.toStringAsFixed(0)}°C',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: (20 * scale),
                                        ),
                                      ),
                                  ],
                                )
                              : Text(
                                  '-',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: (20 * scale),
                                  ),
                                ),
                        ),
                      ),
                      Expanded(
                        child: Align(
                          alignment: Alignment.centerRight,
                          child: ClockText(fontSize: (20 * scale)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAdvertisement(Map<String, dynamic> ads) {
    final String? landscape = ads['source_landscape'] as String?;
    final String? portrait = ads['source_portrait'] as String?;
    final String videoUrl = _deviceIsLandscape
        ? (landscape ?? portrait ?? '')
        : (portrait ?? landscape ?? '');
    final title = ads['title'] ?? '';

    if (videoUrl.isEmpty) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_backdropProvider != null)
            RepaintBoundary(
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeInOut,
                opacity: _backdropOpacity,
                child: SizedBox.expand(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        image: _backdropProvider!,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          if (_isLoading)
            const Center(child: CircularProgressIndicator(color: Colors.white))
          else if (_error != null)
            GestureDetector(
              onTap: _loadContent,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Colors.white,
                      size: 64,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erro ao carregar conteúdo',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Toque para tentar novamente',
                      style: TextStyle(color: Colors.grey[400], fontSize: 18),
                    ),
                  ],
                ),
              ),
            )
          else
            _buildContent(),

          if (!_isLoading && _error == null && _isPreparing)
            Container(
              color: Colors.black.withOpacity(0.7),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Preparando conteúdo para modo offline...',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Vídeos: $_videoDone/$_videoTotal   Imagens: $_imageDone/$_imageTotal',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: 260,
                      child: LinearProgressIndicator(
                        value: _prepareProgress.clamp(0.0, 1.0),
                        backgroundColor: Colors.white24,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          Colors.white,
                        ),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          AdVideoLayer(key: _adLayerKey),
        ],
      ),
    );
  }
}

class ClockText extends StatefulWidget {
  final double fontSize;
  const ClockText({super.key, this.fontSize = 20});

  @override
  State<ClockText> createState() => _ClockTextState();
}

class _ClockTextState extends State<ClockText> {
  late Timer _t;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _t = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _t.cancel();
    super.dispose();
  }

  String _fmt2(int v) => v.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final dateStr = '${_fmt2(_now.day)}/${_fmt2(_now.month)}/${_now.year}';
    final timeStr =
        '${_fmt2(_now.hour)}:${_fmt2(_now.minute)}:${_fmt2(_now.second)}';
    return Text(
      '$dateStr $timeStr',
      style: TextStyle(color: Colors.white70, fontSize: widget.fontSize),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}
