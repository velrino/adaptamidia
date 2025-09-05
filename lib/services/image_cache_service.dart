import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:path_provider/path_provider.dart';

/// Serviço para pré-carregar e gerenciar cache de IMAGENS
class ImageCacheService {
  static final ImageCacheService _instance = ImageCacheService._internal();
  static ImageCacheService get instance => _instance;
  ImageCacheService._internal();

  final DefaultCacheManager _cache = DefaultCacheManager();
  Directory? _manifestDir;
  File? _manifestFile;
  Map<String, DateTime> _lastSeen = {};

  Future<void> _initIfNeeded() async {
    if (_manifestDir != null) return;
    final appDir = await getApplicationDocumentsDirectory();
    _manifestDir = Directory('${appDir.path}/seemidia_images');
    if (!await _manifestDir!.exists()) {
      await _manifestDir!.create(recursive: true);
    }
    _manifestFile = File('${_manifestDir!.path}/manifest.json');
    if (await _manifestFile!.exists()) {
      try {
        final txt = await _manifestFile!.readAsString();
        final Map<String, dynamic> data = json.decode(txt);
        _lastSeen = data.map((k, v) => MapEntry(k, DateTime.tryParse(v as String) ?? DateTime.now()));
      } catch (_) {
        _lastSeen = {};
      }
    }
  }

  Future<void> _persistManifest() async {
    if (_manifestFile == null) return;
    final map = _lastSeen.map((k, v) => MapEntry(k, v.toIso8601String()));
    await _manifestFile!.writeAsString(json.encode(map), flush: true);
  }

  /// Verifica rapidamente se a URL já está no cache de disco
  Future<bool> isCached(String url) async {
    if (url.isEmpty) return false;
    final cached = await _cache.getFileFromCache(url);
    return cached != null && await cached.file.exists();
  }

  /// Retorna o arquivo em cache (se existir) para a [url].
  /// Não dispara download; retorna null se não estiver em cache.
  Future<File?> getFileFromCache(String url) async {
    if (url.isEmpty) return null;
    final info = await _cache.getFileFromCache(url);
    if (info != null && await info.file.exists()) {
      return info.file;
    }
    return null;
  }

  /// Faz download e armazena a imagem no cache de disco
  Future<File?> prefetch(String url) async {
    if (url.isEmpty) return null;
    try {
      await _initIfNeeded();
      // Se já está em cache, retorna imediatamente
      final cached = await _cache.getFileFromCache(url);
      if (cached != null && await cached.file.exists()) {
        _lastSeen[url] = DateTime.now();
        unawaited(_persistManifest());
        return cached.file;
      }

      // Garante que o arquivo é baixado e persistido
      final fileInfo = await _cache.downloadFile(url);
      _lastSeen[url] = DateTime.now();
      unawaited(_persistManifest());
      return fileInfo.file;
    } catch (e) {
      // Mantém falha silenciosa para não travar o ciclo
      return null;
    }
  }

  /// Pré-carrega uma lista de imagens com limite de concorrência
  Future<void> preloadAll(List<String> urls, {int concurrency = 4, void Function(double progress)? onProgress}) async {
    await _initIfNeeded();
    final unique = urls.where((u) => u.isNotEmpty).toSet().toList();
    if (unique.isEmpty) {
      onProgress?.call(1.0);
      return;
    }

    int completed = 0;
    Future<void> runBatch(Iterable<String> batch) async {
      await Future.wait(batch.map((u) async {
        await prefetch(u);
        completed++;
        onProgress?.call(completed / unique.length);
      }));
    }

    for (int i = 0; i < unique.length; i += concurrency) {
      final end = (i + concurrency).clamp(0, unique.length);
      await runBatch(unique.sublist(i, end));
    }
  }

  /// Remove imagens do cache que não estão em [keepUrls] e são mais antigas que [maxAge]
  Future<void> cleanupOld({required Set<String> keepUrls, Duration maxAge = const Duration(days: 15)}) async {
    await _initIfNeeded();
    final now = DateTime.now();
    final toRemove = <String>[];
    _lastSeen.forEach((url, seenAt) {
      if (!keepUrls.contains(url) && now.difference(seenAt) > maxAge) {
        toRemove.add(url);
      }
    });
    for (final url in toRemove) {
      try {
        await _cache.removeFile(url);
      } catch (_) {}
      _lastSeen.remove(url);
    }
    await _persistManifest();
  }
}
