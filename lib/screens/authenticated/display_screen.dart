import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_vlc_player/flutter_vlc_player.dart';
import 'package:http/http.dart' as http;
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/storage_service.dart';
import '../../services/media_cache_service.dart';

/// TODO: ajuste este token se necessário.
const _authToken =
    'Bearer REDACTED';

enum ItemType { news, ad }

class PlaylistItem {
  final ItemType type;
  final String? title;
  final String? description;
  final String? author;
  final String? sourceName;
  final String? imageUrl;
  final String? mediaUrl;
  final bool isVideo;
  final int seconds;
  File? cachedFile; // Arquivo local após download

  PlaylistItem.news({
    required this.title,
    required this.description,
    required this.author,
    required this.sourceName,
    required this.imageUrl,
  }) : type = ItemType.news,
       seconds = 5,
       mediaUrl = null,
       isVideo = false;

  PlaylistItem.ad({
    required this.mediaUrl,
    required this.isVideo,
    required this.seconds,
  }) : type = ItemType.ad,
       title = null,
       description = null,
       author = null,
       sourceName = null,
       imageUrl = null;
}

class DisplayPlaylistScreen extends StatefulWidget {
  final String unitId;
  const DisplayPlaylistScreen({super.key, required this.unitId});

  @override
  State<DisplayPlaylistScreen> createState() => _DisplayPlaylistScreenState();
}

class _DisplayPlaylistScreenState extends State<DisplayPlaylistScreen> {
  // Estados
  bool _isInitializing = true;
  bool _isPreloading = false;
  String? _error;
  bool _isLandscape = true;

  // Progresso
  double _loadingProgress = 0.0;
  String _loadingMessage = 'Iniciando...';
  int _totalFiles = 0;
  int _loadedFiles = 0;

  // Playlist
  final List<PlaylistItem> _items = [];
  int _index = 0;
  Timer? _playTimer;
  Timer? _progressTimer;
  double _playProgress = 0.0;

  // VLC Player
  VlcPlayerController? _vlc;
  bool _isVideoReady = false;

  // Cache service
  final MediaCacheService _cacheService = MediaCacheService.instance;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _initializeApp();
  }

  @override
  void dispose() {
    _playTimer?.cancel();
    _progressTimer?.cancel();
    _disposeVlc(); // Não posso usar await aqui no dispose()
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  Future<void> _initializeApp() async {
    try {
      setState(() {
        _loadingMessage = 'Configurando sistema...';
        _loadingProgress = 0.1;
      });

      // Inicializa cache
      await _cacheService.init();

      // Configura orientação
      final config = await StorageService.getDeviceConfig();
      _isLandscape = config?.isLandscape ?? true;

      await SystemChrome.setPreferredOrientations(
        _isLandscape
            ? [
                DeviceOrientation.landscapeLeft,
                DeviceOrientation.landscapeRight,
              ]
            : [DeviceOrientation.portraitUp, DeviceOrientation.portraitDown],
      );

      setState(() {
        _loadingMessage = 'Conectando ao servidor...';
        _loadingProgress = 0.2;
      });

      // Busca playlist
      await _fetchPlaylist();

      setState(() {
        _loadingMessage = 'Preparando conteúdo...';
        _loadingProgress = 0.3;
      });

      // Pré-carrega todo o conteúdo
      await _preloadAllContent();

      // Inicia reprodução
      setState(() {
        _isInitializing = false;
        _isPreloading = false;
      });

      _startPlayback();
    } catch (e) {
      setState(() {
        _isInitializing = false;
        _error = 'Erro ao inicializar: $e';
      });
    }
  }

  Future<void> _fetchPlaylist() async {
    final url =
        'https://9aca430ada6d.ngrok-free.app/display/unit/${widget.unitId}';

    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': _authToken},
    );

    if (response.statusCode != 200) {
      throw Exception('Erro ao buscar playlist: ${response.statusCode}');
    }

    final jsonData = json.decode(response.body) as Map<String, dynamic>;
    final List<dynamic> data = jsonData['data'] as List<dynamic>;

    for (final item in data) {
      final type = (item['type'] as String?) ?? '';

      if (type == 'NEWS') {
        final news = item['news'] as Map<String, dynamic>;
        _items.add(
          PlaylistItem.news(
            title: (news['title'] ?? '') as String,
            description: (news['description'] ?? '') as String,
            author: (news['author'] ?? '') as String,
            sourceName: (news['source_name'] ?? '') as String,
            imageUrl: (news['image'] ?? news['url']) as String?,
          ),
        );
      } else if (type == 'ADVERTISEMENT') {
        final ads = item['ads'] as Map<String, dynamic>;
        final source = (ads['source'] ?? '') as String;
        final mediaType = (ads['type'] ?? 'VIDEO') as String;
        final seconds = (ads['seconds'] ?? 10) as int;
        final isVideo =
            mediaType.toUpperCase() == 'VIDEO' ||
            source.toLowerCase().endsWith('.mp4') ||
            source.toLowerCase().endsWith('.m3u8');

        _items.add(
          PlaylistItem.ad(mediaUrl: source, isVideo: isVideo, seconds: seconds),
        );
      }
    }

    if (_items.isEmpty) {
      throw Exception('Nenhum conteúdo disponível');
    }
  }

  Future<void> _preloadAllContent() async {
    setState(() {
      _isPreloading = true;
      _loadingMessage = 'Baixando conteúdo...';
    });

    // Coleta todas as URLs
    final urlsToDownload = <String>[];

    for (final item in _items) {
      if (item.type == ItemType.news && item.imageUrl != null) {
        urlsToDownload.add(item.imageUrl!);
      } else if (item.type == ItemType.ad && item.mediaUrl != null) {
        // Por enquanto, não vamos pré-baixar vídeos grandes
        // Apenas imagens de anúncios
        if (!item.isVideo) {
          urlsToDownload.add(item.mediaUrl!);
        }
      }
    }

    _totalFiles = urlsToDownload.length;
    _loadedFiles = 0;

    // Baixa conteúdo com progresso
    for (int i = 0; i < urlsToDownload.length; i++) {
      final url = urlsToDownload[i];

      setState(() {
        _loadedFiles = i + 1;
        _loadingProgress = 0.3 + (0.6 * (_loadedFiles / _totalFiles));
        _loadingMessage = 'Baixando conteúdo $_loadedFiles de $_totalFiles...';
      });

      final file = await _cacheService.downloadFile(url);

      // Associa arquivo baixado ao item
      for (final item in _items) {
        if (item.imageUrl == url || item.mediaUrl == url) {
          item.cachedFile = file;
        }
      }
    }

    setState(() {
      _loadingProgress = 0.95;
      _loadingMessage = 'Finalizando preparação...';
    });

    // Pequeno delay para UX
    await Future.delayed(const Duration(milliseconds: 500));

    setState(() {
      _loadingProgress = 1.0;
      _loadingMessage = 'Pronto!';
    });
  }

  void _startPlayback() {
    if (_items.isEmpty) return;
    _playCurrent();
  }

  Future<void> _disposeVlc() async {
    if (_vlc != null) {
      try {
        // Remove listener primeiro
        _vlc!.removeListener(_onVlcPlayerStateChanged);
        
        // Para o vídeo se estiver tocando
        if (_vlc!.value.isInitialized && _vlc!.value.isPlaying) {
          await _vlc!.pause();
        }
        
        // Aguarda um frame antes do dispose
        await Future.delayed(const Duration(milliseconds: 100));
        
        // Dispose do controller
        await _vlc!.dispose();
      } catch (e) {
        print('Erro ao fazer dispose do VLC: $e');
      }
      
      _vlc = null;
    }
    _isVideoReady = false;
  }

  Future<void> _playCurrent() async {
    if (!mounted) return;

    _playTimer?.cancel();
    _progressTimer?.cancel();
    await _disposeVlc();

    setState(() {
      _playProgress = 0.0;
    });

    final item = _items[_index];

    // Pré-carrega próximo item em background
    _preloadNextItem();

    if (item.type == ItemType.ad && item.isVideo && item.mediaUrl != null) {
      // Configura VLC para vídeo
      setState(() {
        _isVideoReady = false;
      });

      try {
        _vlc = VlcPlayerController.network(
          item.mediaUrl!,
          hwAcc: HwAcc.auto,
          autoPlay: false, // Controle manual
          options: VlcPlayerOptions(
            advanced: VlcAdvancedOptions([
              VlcAdvancedOptions.networkCaching(2000),
              ':no-drop-late-frames',
              ':no-skip-frames',
            ]),
          ),
        );

        // Aguarda vídeo estar pronto com timeout
        _vlc!.addListener(_onVlcPlayerStateChanged);

        // Aguarda um frame antes de inicializar
        await Future.delayed(const Duration(milliseconds: 200));
        
        if (mounted && _vlc != null) {
          await _vlc!.initialize();
          
          // Timeout para inicialização (10 segundos)
          Timer(const Duration(seconds: 10), () {
            if (!_isVideoReady && mounted) {
              print('Timeout na inicialização do vídeo, pulando...');
              _nextItem();
            }
          });
        }
      } catch (e) {
        print('Erro ao inicializar VLC: $e');
        // Se falhar, pula para o próximo item
        if (mounted) {
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted) _nextItem();
          });
        }
        return;
      }
      
    } else {
      // Imagem ou notícia - inicia timer direto
      _startPlayTimer(item.seconds);
    }
  }

  void _onVlcPlayerStateChanged() {
    if (!mounted || _vlc == null) return;
    
    try {
      if (_vlc!.value.isInitialized && !_isVideoReady) {
        setState(() {
          _isVideoReady = true;
        });
        
        // Inicia reprodução com pequeno delay
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted && _vlc != null && _vlc!.value.isInitialized) {
            _vlc!.play();
            _startPlayTimer(_items[_index].seconds);
          }
        });
      }
    } catch (e) {
      print('Erro no listener do VLC: $e');
      // Se der erro, pula para o próximo
      if (mounted) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) _nextItem();
        });
      }
    }
  }

  void _startPlayTimer(int seconds) {
    final duration = Duration(seconds: seconds);
    final startTime = DateTime.now();

    // Timer principal
    _playTimer = Timer(duration, _nextItem);

    // Timer de progresso (atualiza a cada 100ms)
    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      final elapsed = DateTime.now().difference(startTime);
      final progress = elapsed.inMilliseconds / duration.inMilliseconds;

      setState(() {
        _playProgress = progress.clamp(0.0, 1.0);
      });

      if (progress >= 1.0) {
        timer.cancel();
      }
    });
  }

  void _nextItem() {
    _index = (_index + 1) % _items.length;
    _playCurrent();
  }

  void _preloadNextItem() {
    // Pré-carrega próximo item em background
    final nextIndex = (_index + 1) % _items.length;
    final nextItem = _items[nextIndex];

    if (nextItem.type == ItemType.news && nextItem.imageUrl != null) {
      _cacheService.preloadNext(nextItem.imageUrl!);
    } else if (nextItem.type == ItemType.ad &&
        nextItem.mediaUrl != null &&
        !nextItem.isVideo) {
      _cacheService.preloadNext(nextItem.mediaUrl!);
    }
  }

  Widget _buildLoadingScreen() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo SeeMidia
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.play_circle_filled,
                  size: 60,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 48),

              // Mensagem
              Text(
                _loadingMessage,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              // Progresso detalhado
              if (_totalFiles > 0)
                Text(
                  '$_loadedFiles de $_totalFiles arquivos',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 14,
                  ),
                ),
              const SizedBox(height: 32),

              // Barra de progresso
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _loadingProgress,
                  minHeight: 8,
                  backgroundColor: Colors.white.withOpacity(0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Colors.white.withOpacity(0.9),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Porcentagem
              Text(
                '${(_loadingProgress * 100).toInt()}%',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red.withOpacity(0.8),
              ),
              const SizedBox(height: 24),
              Text(
                'Erro ao carregar conteúdo',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _error ?? 'Erro desconhecido',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _isInitializing = true;
                    _error = null;
                  });
                  _initializeApp();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Tentar novamente'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white.withOpacity(0.1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVideo() {
    if (_vlc == null || !_isVideoReady) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white24),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        return Container(
          color: Colors.black,
          child: ClipRect(
            child: Transform.scale(
              scale: 1.02, // Pequeno zoom para eliminar bordas
              child: AspectRatio(
                aspectRatio: constraints.maxWidth / constraints.maxHeight,
                child: VlcPlayer(
                  controller: _vlc!,
                  aspectRatio: constraints.maxWidth / constraints.maxHeight,
                  placeholder: Container(color: Colors.black),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildImage(PlaylistItem item) {
    final url = item.type == ItemType.news ? item.imageUrl : item.mediaUrl;

    if (url == null) {
      return Container(color: Colors.black);
    }

    // Se temos arquivo em cache, usa ele
    if (item.cachedFile != null) {
      return Container(
        color: Colors.black,
        child: Image.file(
          item.cachedFile!,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
        ),
      );
    }

    // Fallback para network image com cache
    return Container(
      color: Colors.black,
      child: CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        placeholder: (context, url) => Container(
          color: Colors.black,
          child: const Center(
            child: CircularProgressIndicator(color: Colors.white24),
          ),
        ),
        errorWidget: (context, url, error) => Container(
          color: Colors.black,
          child: const Icon(Icons.error, color: Colors.white24, size: 48),
        ),
      ),
    );
  }

  Widget _buildNewsOverlay(PlaylistItem item) {
    final isL = _isLandscape;

    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withOpacity(0.7),
              Colors.black.withOpacity(0.9),
            ],
          ),
        ),
        padding: EdgeInsets.all(isL ? 24 : 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Logo SeeMidia
            Container(
              width: isL ? 100 : 80,
              height: isL ? 100 : 80,
              margin: EdgeInsets.only(right: isL ? 20 : 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.play_circle_filled,
                size: isL ? 50 : 40,
                color: Colors.white.withOpacity(0.9),
              ),
            ),

            // Textos
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item.sourceName?.isNotEmpty ?? false)
                    Text(
                      item.sourceName!,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: isL ? 14 : 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    item.title ?? '',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: isL ? 24 : 20,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    item.description ?? '',
                    maxLines: isL ? 2 : 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: isL ? 16 : 14,
                      height: 1.3,
                    ),
                  ),
                  if (item.author?.isNotEmpty ?? false) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Por ${item.author}',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: isL ? 13 : 12,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        height: 3,
        color: Colors.black.withOpacity(0.3),
        child: LinearProgressIndicator(
          value: _playProgress,
          backgroundColor: Colors.transparent,
          valueColor: AlwaysStoppedAnimation<Color>(
            Colors.white.withOpacity(0.7),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Tela de carregamento inicial
    if (_isInitializing || _isPreloading) {
      return _buildLoadingScreen();
    }

    // Tela de erro
    if (_error != null) {
      return _buildErrorScreen();
    }

    // Playlist vazia
    if (_items.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: const Center(
          child: Text(
            'Nenhum conteúdo disponível',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    // Player principal
    final item = _items[_index];

    Widget content;
    if (item.type == ItemType.ad && item.isVideo) {
      content = _buildVideo();
    } else if (item.type == ItemType.ad) {
      content = _buildImage(item);
    } else {
      // News
      content = Stack(
        fit: StackFit.expand,
        children: [_buildImage(item), _buildNewsOverlay(item)],
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [content, _buildProgressBar()]),
    );
  }
}

/// Stub do StorageService
class DeviceConfig {
  final bool isLandscape;
  DeviceConfig(this.isLandscape);
}
