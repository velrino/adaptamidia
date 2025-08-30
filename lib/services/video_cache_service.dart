import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'local_server.dart';

/// Serviço especializado para cache de vídeos MP4
class VideoCacheService {
  static final VideoCacheService _instance = VideoCacheService._internal();
  static VideoCacheService get instance => _instance;
  VideoCacheService._internal();

  final Map<String, File> _cache = {};
  final Map<String, double> _downloadProgress = {};
  final Map<String, StreamController<double>> _progressControllers = {};
  final Set<String> _downloading = {};
  
  Directory? _cacheDir;
  
  /// Inicializa o diretório de cache
  Future<void> init() async {
    final appDir = await getApplicationDocumentsDirectory();
    _cacheDir = Directory('${appDir.path}/seemidia_videos');
    if (!await _cacheDir!.exists()) {
      await _cacheDir!.create(recursive: true);
    }
    await _loadExistingCache();
    
    // Inicia servidor HTTP local para servir vídeos
    await LocalVideoServer.instance.start();
  }

  /// Remove arquivos do cache mais antigos que [maxAge] e não referenciados
  /// pelos URLs atuais de conteúdo (keepUrls)
  Future<void> cleanupCache({
    required Set<String> keepUrls,
    Duration maxAge = const Duration(days: 15),
  }) async {
    if (_cacheDir == null) await init();

    final now = DateTime.now();
    final keepKeys = keepUrls.map(_getCacheKey).toSet();

    final entries = await _cacheDir!.list().toList();
    for (final e in entries) {
      if (e is! File) continue;
      if (!e.path.endsWith('.mp4')) continue;

      final fileName = e.uri.pathSegments.last;
      final key = fileName.replaceAll('.mp4', '');

      if (keepKeys.contains(key)) continue; // ainda em uso

      final stat = await e.stat();
      if (now.difference(stat.modified) > maxAge) {
        try {
          await e.delete();
          _cache.remove(key);
          print('🧹 Removido vídeo antigo do cache: ${e.path}');
        } catch (err) {
          print('⚠️ Falha ao remover ${e.path}: $err');
        }
      }
    }
  }
  
  /// Carrega vídeos já existentes no cache
  Future<void> _loadExistingCache() async {
    if (_cacheDir == null) return;
    
    final files = await _cacheDir!.list().toList();
    for (final file in files) {
      if (file is File && file.path.endsWith('.mp4')) {
        final fileName = file.uri.pathSegments.last;
        final key = fileName.replaceAll('.mp4', '');
        _cache[key] = file;
      }
    }
    print('🎥 ${_cache.length} vídeos já em cache local');
  }
  
  /// Gera chave única para URL (SEM normalização)
  String _getCacheKey(String url) {
    // USA URL ORIGINAL - não adiciona .mp4 duplicado
    final bytes = utf8.encode(url);
    final digest = md5.convert(bytes);
    return digest.toString();
  }
  
  /// Verifica se vídeo já está em cache (GARANTIDO)
  Future<File?> getVideoFromCache(String url) async {
    if (_cacheDir == null) await init();
    
    final key = _getCacheKey(url);
    
    // 1. Verifica cache em memória primeiro
    if (_cache.containsKey(key)) {
      final file = _cache[key]!;
      if (await file.exists()) {
        print('💾 Vídeo encontrado em cache: ${file.path}');
        return file;
      } else {
        // Remove referência se arquivo não existe mais
        _cache.remove(key);
      }
    }
    
    // 2. Procura por arquivo existente no disco
    final file = File('${_cacheDir!.path}/$key.mp4');
    if (await file.exists()) {
      _cache[key] = file;
      print('📁 Vídeo recuperado do disco: ${file.path}');
      return file;
    }
    
    print('❌ Vídeo NÃO encontrado em cache: $url');
    return null;
  }
  
  /// Stream de progresso do download
  Stream<double> getProgressStream(String url) {
    final key = _getCacheKey(url);
    if (!_progressControllers.containsKey(key)) {
      _progressControllers[key] = StreamController<double>.broadcast();
    }
    return _progressControllers[key]!.stream;
  }
  
  /// Atualiza progresso do download
  void _updateProgress(String url, double progress) {
    final key = _getCacheKey(url);
    _downloadProgress[key] = progress;
    
    if (_progressControllers.containsKey(key)) {
      _progressControllers[key]!.add(progress);
    }
  }
  
  /// Baixa vídeo MP4 com verificação de duplicata
  Future<File?> downloadVideo(String url) async {
    try {
      if (_cacheDir == null) await init();
      
      final key = _getCacheKey(url);
      
      // GARANTIA 1: Verifica se já está em cache
      final cached = await getVideoFromCache(url);
      if (cached != null) {
        _updateProgress(url, 1.0);
        return cached;
      }
      
      // GARANTIA 2: Evita downloads duplicados simultâneos
      if (_downloading.contains(key)) {
        print('⏳ Download já em andamento para: $url');
        // Aguarda download atual terminar
        while (_downloading.contains(key)) {
          await Future.delayed(const Duration(milliseconds: 100));
        }
        return await getVideoFromCache(url);
      }
      
      _downloading.add(key);
      
      print('⬇️  Iniciando download: $url');
      final file = File('${_cacheDir!.path}/$key.mp4');
      
      // Download com headers otimizados
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'User-Agent': 'SeeMidia/1.0',
          'Accept': 'video/mp4',
          'Connection': 'keep-alive',
        },
      );
      
      if (response.statusCode != 200) {
        throw Exception('HTTP ${response.statusCode} para $url');
      }
      
      // Salva arquivo
      await file.writeAsBytes(response.bodyBytes);
      
      // Valida arquivo salvo
      if (await file.exists() && await file.length() > 0) {
        _cache[key] = file;
        _updateProgress(url, 1.0);
        print('✅ Vídeo baixado com sucesso: ${file.path} (${await file.length()} bytes)');
        return file;
      } else {
        throw Exception('Arquivo salvo inválido');
      }
      
    } catch (e) {
      print('❌ Erro ao baixar vídeo $url: $e');
      return null;
    } finally {
      final key = _getCacheKey(url);
      _downloading.remove(key);
    }
  }
  
  /// Converte URL remota para URL local via servidor HTTP
  Future<String> getLocalVideoUrl(String remoteUrl) async {
    final file = await getVideoFromCache(remoteUrl);
    if (file != null) {
      // Usa servidor HTTP local em vez de file://
      return LocalVideoServer.instance.getLocalUrl(file.path);
    }
    
    // Se não está em cache, tenta baixar
    final downloadedFile = await downloadVideo(remoteUrl);
    if (downloadedFile != null) {
      return LocalVideoServer.instance.getLocalUrl(downloadedFile.path);
    }
    
    // Fallback: retorna URL remota (modo online)
    print('⚠️  Fallback para URL remota: $remoteUrl');
    return remoteUrl;
  }
  
  /// Pré-carrega lista de vídeos em background
  Future<void> preloadVideos(List<String> urls) async {
    print('📦 Pré-carregando ${urls.length} vídeos...');
    
    final futures = <Future>[];
    for (final url in urls) {
      futures.add(downloadVideo(url));
      
      // Limita downloads simultâneos
      if (futures.length >= 2) {
        await Future.wait(futures);
        futures.clear();
        await Future.delayed(const Duration(milliseconds: 200));
      }
    }
    
    if (futures.isNotEmpty) {
      await Future.wait(futures);
    }
    
    print('✅ Pré-carregamento concluído');
  }
  
  /// Estatísticas do cache
  Map<String, dynamic> getStats() {
    return {
      'total_cached': _cache.length,
      'downloading': _downloading.length,
      'cache_dir': _cacheDir?.path ?? 'não inicializado',
    };
  }
  
  /// Limpa cache (para testes/debug)
  Future<void> clearCache() async {
    if (_cacheDir != null && await _cacheDir!.exists()) {
      await _cacheDir!.delete(recursive: true);
      await _cacheDir!.create(recursive: true);
    }
    _cache.clear();
    _downloadProgress.clear();
    _downloading.clear();
    print('🗑️  Cache limpo');
  }
}
