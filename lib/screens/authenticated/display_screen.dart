import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
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

  // Video controllers
  VideoPlayerController? _videoController;
  VideoPlayerController? _nextVideoController; // pré-carregamento do próximo

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
        if (_videoController!.value.isInitialized && mounted) {
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

    _disposeVideoController(_videoController);
    _disposeVideoController(_nextVideoController);

    WakelockPlus.disable();
    super.dispose();
  }

  Future<void> _disposeVideoController(VideoPlayerController? c) async {
    if (c == null) return;
    try {
      // Remove todos os listeners primeiro para evitar callbacks após dispose
      c.removeListener(() {});
      // Pause rápido para parar processamento
      if (c.value.isInitialized) {
        await c.pause();
        // Volume 0 para evitar codec processing durante dispose
        await c.setVolume(0.0);
      }
      // Pequeno delay para estabilizar
      await Future.delayed(const Duration(milliseconds: 100));
      await c.dispose();
    } catch (_) {
      // Ignore erros durante dispose
    }
  }

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

  Future<void> _playVideo(DisplayContent content) async {
    // Guarda referência do controller anterior antes de limpar
    final oldController = _videoController;
    
    final controller = VideoPlayerController.networkUrl(
      Uri.parse(content.url),
      videoPlayerOptions: VideoPlayerOptions(
        mixWithOthers: false, // Não misturar com outros players
        allowBackgroundPlayback: false, // Não tocar em background
      ),
    );

    // Define o novo controller ANTES de dispose do antigo
    _videoController = controller;
    
    // Agora descarta o anterior
    await _disposeVideoController(oldController);

    try {
      // CRÍTICO: Define volume 0 ANTES de inicializar para evitar codec AAC
      await controller.setVolume(0.0);
      await controller.initialize();
    } catch (e) {
      debugPrint('🎥 Falha ao inicializar vídeo atual: $e');
      rethrow;
    }

    if (!mounted) return;

    // Configurações para reprodução estável
    await controller.setLooping(false);
    await controller.play();

    // Listener para avançar ao final
    void videoEndListener() async {
      if (!mounted || _disposed) return;
      final v = controller.value;
      if (v.isInitialized && !v.isPlaying) {
        // Remove listener antes de avançar para evitar múltiplas chamadas
        controller.removeListener(videoEndListener);
        await _goToNextContent();
      }
    }
    
    controller.addListener(videoEndListener);

    // Pré-carrega próximo vídeo (se existir)
    _preloadNextVideo();

    setState(() {}); // re-render para exibir player

    // Fallback timer de segurança (se quiser limitar por duração custom)
    _contentTimer?.cancel();
    if (content.durationSeconds != null && content.durationSeconds! > 0) {
      _contentTimer = Timer(Duration(seconds: content.durationSeconds!), () {
        if (mounted) {
          _goToNextContent();
        }
      });
    }
  }

  void _preloadNextVideo() {
    // Limpa preload anterior
    _disposeVideoController(_nextVideoController);
    _nextVideoController = null;

    if (_contents.isEmpty) return;

    final nextIdx = (_currentIndex + 1) % _contents.length;
    final next = _contents[nextIdx];
    if (next.type != ContentType.video) return;

    try {
      final c = VideoPlayerController.networkUrl(
        Uri.parse(next.url),
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false, // Isolado de outros players
          allowBackgroundPlayback: false, // Não tocar em background
        ),
      );
      _nextVideoController = c;
      
      // Preload otimizado: volume 0 + initialize assíncrono
      c.setVolume(0.0).then((_) {
        return c.initialize();
      }).then((_) {
        // Deixa pronto para trocar rápido (não dá play ainda)
        debugPrint('⬇️ Próximo vídeo pré-carregado');
      }).catchError((e) {
        debugPrint('⚠️ Erro no preload do próximo vídeo: $e');
      });
    } catch (e) {
      debugPrint('⚠️ Exceção ao preparar preload: $e');
    }
  }

  Future<void> _showImage(DisplayContent content) async {
    // Ao trocar para imagem, garante que não há vídeo tocando
    final oldController = _videoController;
    _videoController = null; // Limpa referência primeiro
    await _disposeVideoController(oldController);
    
    if (mounted) setState(() {});

    // Duração padrão para imagens (8s) se não especificado
    final secs = (content.durationSeconds ?? 8).clamp(1, 3600);
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

    // Se o próximo já está pré-carregado e é vídeo, faça um handoff rápido
    final next = _contents[_currentIndex];
    if (next.type == ContentType.video && _nextVideoController != null) {
      // Troca controllers: o próximo vira atual
      final ready = _nextVideoController!;
      _nextVideoController = null; // libera slot

      await _disposeVideoController(_videoController);
      _videoController = ready;

      try {
        await ready.setLooping(false);
        await ready.play();
      } catch (e) {
        debugPrint('🎥 Erro ao dar play no vídeo pré-carregado: $e');
        await _startContentDisplay();
        return;
      }

      setState(() {});
      _preloadNextVideo();

      // Fallback de duração
      _contentTimer?.cancel();
      if (next.durationSeconds != null && next.durationSeconds! > 0) {
        _contentTimer = Timer(Duration(seconds: next.durationSeconds!), () {
          if (mounted) _goToNextContent();
        });
      }

      return;
    }

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

  /// FULLSCREEN real do vídeo independente do tamanho do arquivo
  /// Força o vídeo a preencher toda a tela usando Transform.scale se necessário
  Widget _buildVideoPlayer() {
    final controller = _videoController;
    
    // Verifica se controller existe, está inicializado E não foi disposed
    if (controller == null || !controller.value.isInitialized || _disposed) {
      return const ColoredBox(color: Colors.black);
    }

    // Double check se ainda está válido antes de renderizar
    try {
      final size = controller.value.size;
      const overscan = 1.02; // 2% de zoom para esconder as bordas verdes

      return ClipRect(
        child: FittedBox(
          fit: BoxFit.cover,
          alignment: Alignment.center,
          child: SizedBox(
            // aumenta levemente o "quadro" do vídeo para cortar as extremidades
            width: size.width * overscan,
            height: size.height * overscan,
            child: VideoPlayer(controller),
          ),
        ),
      );
    } catch (e) {
      // Se houve erro ao acessar propriedades do controller, provavelmente foi disposed
      debugPrint('⚠️ Controller inválido no _buildVideoPlayer: $e');
      return const ColoredBox(color: Colors.black);
    }
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
