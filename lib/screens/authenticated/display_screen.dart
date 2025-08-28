import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../interfaces/display_unit.dart';
import '../../services/display_service.dart';

/// DisplayScreen
/// - Força fullscreen verdadeiro para vídeos e imagens (cover)
/// - Resistente para rodar 24/7 (wakelock, ciclo de vida, fallback em erro)
/// - Pré-carrega o próximo vídeo quando possível
///
/// Como usar rapidamente:
/// DisplayScreen(contents: [
///   DisplayContent(type: ContentType.image, url: 'https://.../img.jpg', durationSeconds: 8),
///   DisplayContent(type: ContentType.video, url: 'https://.../video.mp4'),
/// ]);
class DisplayScreen extends StatefulWidget {
  const DisplayScreen({
    super.key,
    this.unitId,
    this.contents,
    this.autoStart = true,
  });

  /// ID da unidade para buscar conteúdo via API
  final String? unitId;

  /// Conteúdos (caso não venha por API). Se nulo, adapte o `_loadDisplayUnit()`
  final List<DisplayContent>? contents;

  /// Se deve iniciar automaticamente a reprodução
  final bool autoStart;

  @override
  State<DisplayScreen> createState() => _DisplayScreenState();
}

class _DisplayScreenState extends State<DisplayScreen>
    with WidgetsBindingObserver {
  // Timeline
  List<DisplayContent> _contents = const [];
  int _currentIndex = 0;

  // Timers
  Timer? _contentTimer; // controla duração de imagens e fallback
  Timer? _progressTimer; // opcional p/ reportar progresso

  // Video controllers - v4.0.0 usa controller direto do view
  NativeVideoPlayerController? _videoController;
  StreamSubscription<void>? _eventsSubscription;
  bool _hasStartedPlaying = false; // Flag para saber se o vídeo já começou

  bool _isSettingUp = false; // evita setups concorrentes
  bool _disposed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Imersão total
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    // Mantém a tela ligada 24/7
    WakelockPlus.enable();

    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // Carrega conteúdos
    if (widget.contents != null && widget.contents!.isNotEmpty) {
      _contents = widget.contents!;
    } else {
      _contents = await _loadDisplayUnit();
    }

    if (_contents.isEmpty) return;

    if (widget.autoStart && mounted) {
      await _startContentDisplay();
    }
  }

  /// Carrega conteúdo da unidade via API
  Future<List<DisplayContent>> _loadDisplayUnit() async {
    if (widget.unitId == null) {
      return [];
    }

    try {
      final displayUnit = await DisplayService.instance.getDisplayUnit(
        widget.unitId!,
      );
      if (displayUnit == null) {
        return [];
      }

      // Converte IDisplayContent para DisplayContent do screen
      return displayUnit.contents
          // .where((content) => content.isActive)
          .map((content) => _convertToDisplayContent(content))
          .toList();
    } catch (e) {
      debugPrint('Error loading display unit: $e');
      return [];
    }
  }

  /// Converte IDisplayContent da API para DisplayContent do screen
  DisplayContent _convertToDisplayContent(IDisplayContent apiContent) {
    ContentType type;
    if (apiContent.type == 'NEWS') {
      type = ContentType.image;
    } else if (apiContent.type == 'ADVERTISEMENT') {
      type = ContentType.video;
    } else {
      type = ContentType.image; // default
    }

    int? duration;
    if (apiContent.type == 'NEWS') {
      duration = 5; // NEWS sempre 5 segundos
    } else if (apiContent.seconds != null) {
      duration = apiContent.seconds; // ADS usa campo seconds da API
    }

    return DisplayContent(
      type: type,
      url: apiContent.url,
      durationSeconds: duration,
      title: apiContent.title,
      description: apiContent.description,
      sourceName: apiContent.sourceName,
      author: apiContent.author,
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Pausa/resume confiável ao mudar estado do app
    if (_videoController == null) return;

    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        _videoController!.pause();
        break;
      case AppLifecycleState.resumed:
        if (mounted) {
          _videoController!.play();
        }
        break;
      default:
        break;
    }
  }

  @override
  void dispose() {
    _disposed = true;
    WidgetsBinding.instance.removeObserver(this);

    _contentTimer?.cancel();
    _progressTimer?.cancel();
    _eventsSubscription?.cancel();

    _videoController?.dispose();

    WakelockPlus.disable();
    super.dispose();
  }

  // Método auxiliar para setup do controller (usado no onViewReady)
  String? _currentVideoUrl;

  Future<void> _startContentDisplay() async {
    if (!mounted || _disposed || _isSettingUp) return;

    _isSettingUp = true;
    _contentTimer?.cancel();

    if (_contents.isEmpty) {
      _isSettingUp = false;
      return;
    }

    final content = _contents[_currentIndex % _contents.length];

    try {
      switch (content.type) {
        case ContentType.video:
          await _playVideo(content);
          break;
        case ContentType.image:
          await _showImage(content);
          break;
      }
    } catch (e) {
      debugPrint('⚠️ Erro ao iniciar conteúdo: $e');
      // Em erro, tenta avançar para o próximo sem travar
      await _goToNextContent();
    } finally {
      _isSettingUp = false;
    }
  }

  Future<void> _setupVideoController(NativeVideoPlayerController controller, String videoUrl) async {
    try {
      _videoController = controller;
      
      // Setup de eventos
      _eventsSubscription?.cancel();
      _eventsSubscription = controller.events.listen((event) {
        if (!mounted || _disposed) return;
        
        switch (event) {
          case PlaybackStatusChangedEvent():
            // Video acabou, avança para próximo
            final status = event.status;
            debugPrint('🎥 Status change: $status');
            
            // Marca que o vídeo está tocando
            if (status == PlaybackStatus.playing) {
              _hasStartedPlaying = true;
            }
            
            // Se o vídeo parou APÓS ter começado a tocar, é porque acabou
            if (status == PlaybackStatus.stopped && _hasStartedPlaying) {
              _hasStartedPlaying = false; // Reset flag
              // Pequeno delay para garantir que não é apenas transição de estado
              Future.delayed(const Duration(milliseconds: 500), () {
                if (mounted && !_disposed) {
                  _goToNextContent();
                }
              });
            }
            break;
            
          case PlaybackReadyEvent():
            debugPrint('📹 Video ready');
            break;
            
          case PlaybackPositionChangedEvent():
            // Podemos usar isso para tracking de progresso se quisermos
            break;
            
          default:
            debugPrint('📺 Event: $event');
            break;
        }
      });

      // Carrega o vídeo
      await controller.loadVideo(
        VideoSource(
          path: videoUrl,
          type: VideoSourceType.network,
        ),
      );
      
      if (!mounted) return;
      
      // IMPORTANTE: Dar play no vídeo após carregar
      await controller.play();
      
      setState(() {}); // Re-render para mostrar player
      
    } catch (e) {
      debugPrint('🎥 Erro ao setup controller: $e');
      rethrow;
    }
  }

  Future<void> _playVideo(DisplayContent content) async {
    if (!mounted) return;
    
    // Limpa controller anterior
    _eventsSubscription?.cancel();
    _videoController?.dispose();
    _videoController = null;
    _hasStartedPlaying = false; // Reset flag de playing
    
    // Armazena URL para usar no onViewReady
    _currentVideoUrl = content.url;
    
    setState(() {}); // Re-render para inicializar novo player

    // Fallback timer de segurança
    _contentTimer?.cancel();
    if (content.durationSeconds != null && content.durationSeconds! > 0) {
      _contentTimer = Timer(Duration(seconds: content.durationSeconds!), () {
        if (mounted) {
          _goToNextContent();
        }
      });
    }
  }

  // Preload não é mais necessário com nova API v4.0.0
  // O NativeVideoPlayer é mais eficiente

  Future<void> _showImage(DisplayContent content) async {
    // Ao trocar para imagem, garante que não há vídeo tocando
    _eventsSubscription?.cancel();
    _videoController?.dispose();
    _videoController = null;
    _currentVideoUrl = null; // Limpa URL do vídeo
    
    if (mounted) setState(() {});

    // Duração padrão para imagens (5s) se não especificado
    final secs = (content.durationSeconds ?? 5).clamp(1, 3600);
    _contentTimer?.cancel();
    _contentTimer = Timer(Duration(seconds: secs), () {
      if (mounted) {
        _goToNextContent();
      }
    });
  }

  Future<void> _goToNextContent() async {
    if (!mounted || _disposed) return;

    _contentTimer?.cancel();
    _progressTimer?.cancel();

    if (_contents.isEmpty) return;

    setState(() {
      _currentIndex = (_currentIndex + 1) % _contents.length;
    });

    await _startContentDisplay();
  }

  @override
  Widget build(BuildContext context) {
    final hasContents = _contents.isNotEmpty;
    final DisplayContent? current = hasContents
        ? _contents[_currentIndex % _contents.length]
        : null;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          if (!hasContents)
            const Center(child: CircularProgressIndicator())
          else
            Positioned.fill(child: _buildContent(current!)),
          // Opcional: overlay de debug
          // Positioned(
          //   left: 12,
          //   bottom: 12,
          //   child: _DebugBadge(index: _currentIndex, total: _contents.length),
          // ),
        ],
      ),
    );
  }

  Widget _buildContent(DisplayContent content) {
    switch (content.type) {
      case ContentType.video:
        return _buildVideoPlayer();
      case ContentType.image:
        return _buildImage(content.url);
    }
  }

  /// FULLSCREEN real do vídeo usando native video player v4.0.0
  Widget _buildVideoPlayer() {
    // Se não tem URL do vídeo, retorna tela preta
    if (_currentVideoUrl == null || _disposed) {
      return const ColoredBox(color: Colors.black);
    }

    // NativeVideoPlayerView direto, sem Positioned pois já está dentro de um
    return NativeVideoPlayerView(
      onViewReady: (controller) async {
        try {
          await _setupVideoController(controller, _currentVideoUrl!);
        } catch (e) {
          debugPrint('⚠️ Erro ao setup video controller: $e');
        }
      },
    );
  }

  Widget _buildImage(String url) {
    final content = _getCurrentContent();

    return Stack(
      children: [
        // Imagem de fundo
        Positioned.fill(
          child: CachedNetworkImage(
            imageUrl: url,
            fit: BoxFit.cover,
            errorWidget: (context, _, __) =>
                const ColoredBox(color: Colors.black),
            placeholder: (context, _) => const ColoredBox(color: Colors.black),
          ),
        ),

        // Overlay com informações da notícia (apenas para NEWS)
        if (content?.type == ContentType.image && content?.title != null)
          _buildNewsOverlay(content!),
      ],
    );
  }

  Widget _buildNewsOverlay(DisplayContent content) {
    return Positioned(
      left: 24,
      right: 24,
      bottom: 24,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.8),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            // Logo SeeMidia
            Image.asset(
              'assets/images/logo.png',
              width: 160,
              height: 160,
              fit: BoxFit.contain,
            ),

            const SizedBox(width: 24),

            // Textos ao lado
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Título
                  if (content.title?.isNotEmpty == true)
                    Text(
                      content.title!,
                      style: const TextStyle(
                        fontSize: 42,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                  // Espaço entre título e descrição
                  if (content.title?.isNotEmpty == true &&
                      content.description?.isNotEmpty == true)
                    const SizedBox(height: 10),

                  // Descrição
                  if (content.description?.isNotEmpty == true)
                    Text(
                      content.description!,
                      style: const TextStyle(
                        fontSize: 24,
                        color: Color(0xFFE0E0E0),
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                  // Espaço antes da fonte
                  if ((content.title?.isNotEmpty == true ||
                          content.description?.isNotEmpty == true) &&
                      (content.sourceName?.isNotEmpty == true ||
                          content.author?.isNotEmpty == true))
                    const SizedBox(height: 12),

                  // Fonte e Autor
                  if (content.sourceName?.isNotEmpty == true ||
                      content.author?.isNotEmpty == true)
                    Row(
                      children: [
                        const Icon(
                          Icons.article_outlined,
                          color: Color(0xFFB0B0B0),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _buildSourceText(
                            content.sourceName,
                            content.author,
                          ),
                          style: const TextStyle(
                            fontSize: 18,
                            color: Color(0xFFB0B0B0),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  DisplayContent? _getCurrentContent() {
    if (_contents.isNotEmpty && _currentIndex < _contents.length) {
      return _contents[_currentIndex];
    }
    return null;
  }

  String _buildSourceText(String? sourceName, String? author) {
    if (sourceName?.isNotEmpty == true && author?.isNotEmpty == true) {
      return '$sourceName • $author';
    } else if (sourceName?.isNotEmpty == true) {
      return sourceName!;
    } else if (author?.isNotEmpty == true) {
      return author!;
    }
    return 'SeeMidia';
  }
}

// ======== MODELOS BÁSICOS (adapte ao seu domínio) ========= //

enum ContentType { image, video }

class DisplayContent {
  final ContentType type;
  final String url;
  final int? durationSeconds; // para imagens ou override de vídeo
  final String? title;
  final String? description;
  final String? sourceName;
  final String? author;

  const DisplayContent({
    required this.type,
    required this.url,
    this.durationSeconds,
    this.title,
    this.description,
    this.sourceName,
    this.author,
  });
}

// ======== (Opcional) Widget de debug ======== //
class _DebugBadge extends StatelessWidget {
  final int index;
  final int total;
  const _DebugBadge({required this.index, required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white24),
      ),
      child: DefaultTextStyle(
        style: const TextStyle(color: Colors.white70, fontSize: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.bolt, size: 14, color: Colors.white70),
            const SizedBox(width: 6),
            Text('item ${index + 1} / $total'),
          ],
        ),
      ),
    );
  }
}
