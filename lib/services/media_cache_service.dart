import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

/// Serviço de cache para pré-carregamento de mídia
class MediaCacheService {
  static final MediaCacheService _instance = MediaCacheService._internal();
  static MediaCacheService get instance => _instance;
  MediaCacheService._internal();

  final Map<String, File> _cache = {};
  final Map<String, double> _downloadProgress = {};
  final Map<String, StreamController<double>> _progressControllers = {};
  
  Directory? _cacheDir;
  
  /// Inicializa o diretório de cache
  Future<void> init() async {
    final appDir = await getApplicationDocumentsDirectory();
    _cacheDir = Directory('${appDir.path}/seemidia_videos');
    if (!await _cacheDir!.exists()) {
      await _cacheDir!.create(recursive: true);
    }
    await _cleanOldCache();
    await _loadExistingCache();
  }
  
  /// Carrega vídeos já existentes no cache
  Future<void> _loadExistingCache() async {
    if (_cacheDir == null) return;
    
    final files = await _cacheDir!.list().toList();
    for (final file in files) {
      if (file is File && file.path.endsWith('.mp4')) {
        final fileName = file.uri.pathSegments.last;
        // Reconstrói o mapeamento baseado no nome do arquivo (MD5)
        _cache[fileName.replaceAll('.mp4', '')] = file;
      }
    }
    print('📁 ${_cache.length} vídeos já em cache');
  }
  
  /// Limpa cache antigo (mais de 7 dias)
  Future<void> _cleanOldCache() async {
    if (_cacheDir == null) return;
    
    final now = DateTime.now();
    final files = await _cacheDir!.list().toList();
    
    for (final file in files) {
      if (file is File) {
        final stat = await file.stat();
        if (now.difference(stat.modified).inDays > 7) {
          await file.delete();
        }
      }
    }
  }
  
  /// Gera chave única para URL
  String _getCacheKey(String url) {
    final bytes = utf8.encode(url);
    final digest = md5.convert(bytes);
    return digest.toString();
  }
  
  /// Verifica se arquivo já está em cache
  Future<File?> getFromCache(String url) async {
    if (_cacheDir == null) await init();
    
    final key = _getCacheKey(url);
    
    // Verifica cache em memória primeiro
    if (_cache.containsKey(key)) {
      return _cache[key];
    }
    
    // Procura por arquivo existente no disco
    final file = File('${_cacheDir!.path}/$key.mp4');
    
    if (await file.exists()) {
      _cache[key] = file;
      return file;
    }
    
    return null;
  }
  
  /// Stream de progresso do download
  Stream<double> getProgressStream(String url) {
    if (!_progressControllers.containsKey(url)) {
      _progressControllers[url] = StreamController<double>.broadcast();
    }
    return _progressControllers[url]!.stream;
  }
  
  /// Baixa arquivo com progresso
  Future<File?> downloadFile(String url, {bool priority = false}) async {
    try {
      // Verifica cache primeiro
      final cached = await getFromCache(url);
      if (cached != null) {
        _updateProgress(url, 1.0);
        return cached;
      }
      
      // Inicia download
      final key = _getCacheKey(url);
      final file = File('${_cacheDir!.path}/$key.mp4');
      
      final request = await HttpClient().getUrl(Uri.parse(url));
      request.headers.add('User-Agent', 'SeeMidia/1.0');
      
      final response = await request.close();
      
      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode}');
      }
      
      final contentLength = response.contentLength;
      final sink = file.openWrite();
      int downloaded = 0;
      
      await for (final chunk in response) {
        sink.add(chunk);
        downloaded += chunk.length;
        
        if (contentLength != -1) {
          final progress = downloaded / contentLength;
          _updateProgress(url, progress);
        }
      }
      
      await sink.close();
      
      _cache[url] = file;
      _updateProgress(url, 1.0);
      
      return file;
      
    } catch (e) {
      print('Erro ao baixar $url: $e');
      _updateProgress(url, -1.0); // Indica erro
      return null;
    }
  }
  
  /// Atualiza progresso
  void _updateProgress(String url, double progress) {
    _downloadProgress[url] = progress;
    if (_progressControllers.containsKey(url)) {
      _progressControllers[url]!.add(progress);
      if (progress == 1.0 || progress == -1.0) {
        _progressControllers[url]!.close();
        _progressControllers.remove(url);
      }
    }
  }
  
  /// Pré-carrega lista de URLs
  Future<Map<String, File?>> preloadBatch(
    List<String> urls, {
    Function(double)? onProgress,
  }) async {
    final results = <String, File?>{};
    int completed = 0;
    
    for (final url in urls) {
      final file = await downloadFile(url);
      results[url] = file;
      completed++;
      
      if (onProgress != null) {
        onProgress(completed / urls.length);
      }
    }
    
    return results;
  }
  
  /// Pré-carrega próximo conteúdo em background
  Future<void> preloadNext(String url) async {
    // Baixa com prioridade baixa
    downloadFile(url, priority: false);
  }
  
  /// Limpa todo o cache
  Future<void> clearCache() async {
    _cache.clear();
    _downloadProgress.clear();
    
    if (_cacheDir != null && await _cacheDir!.exists()) {
      await _cacheDir!.delete(recursive: true);
      await _cacheDir!.create(recursive: true);
    }
  }
  
  /// Obtém tamanho total do cache
  Future<int> getCacheSize() async {
    if (_cacheDir == null || !await _cacheDir!.exists()) {
      return 0;
    }
    
    int totalSize = 0;
    final files = await _cacheDir!.list().toList();
    
    for (final file in files) {
      if (file is File) {
        totalSize += await file.length();
      }
    }
    
    return totalSize;
  }
}