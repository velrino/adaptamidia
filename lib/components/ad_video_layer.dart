import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class AdVideoLayer extends StatefulWidget {
  const AdVideoLayer({super.key});

  @override
  State<AdVideoLayer> createState() => AdVideoLayerState();
}

class AdVideoLayerState extends State<AdVideoLayer> {
  VideoPlayerController? _active;
  VideoPlayerController? _standby;
  String? _standbyPath;
  double _activeOpacity = 0.0;
  double _standbyOpacity = 0.0;
  final Duration _fadeDuration = const Duration(milliseconds: 500);
  final Duration _initialFadeDuration = const Duration(milliseconds: 800);

  // Controle de estado para evitar travadas
  bool _isActiveReady = false;
  bool _isStandbyReady = false;

  Future<void> _initController(
    VideoPlayerController controller, {
    bool isStandby = false,
  }) async {
    await controller.initialize();
    controller.setLooping(false);

    // Volume inicial baseado no tipo
    await controller.setVolume(isStandby ? 0.0 : 1.0);

    // IMPORTANTE: Pré-buffer mais agressivo para evitar travada inicial
    await controller.seekTo(Duration.zero);

    // Tocar um pouco para forçar o buffer a carregar
    await controller.play();

    // Aguarda mais tempo para garantir buffer adequado
    await Future.delayed(const Duration(milliseconds: 500));

    // Pausa e volta ao início
    await controller.pause();
    await controller.seekTo(Duration.zero);

    // Marca como pronto
    if (isStandby) {
      _isStandbyReady = true;
    } else {
      _isActiveReady = true;
    }
  }

  Future<void> playFile(File file) async {
    // Se já está tocando o mesmo arquivo, ignora
    if (_active != null && _isActiveReady) {
      final currentPath = (_active!.dataSource ?? '').replaceAll('file://', '');
      if (currentPath == file.path) {
        return;
      }
    }

    // If standby prepared for this file, crossfade com transição suave
    if (_standby != null && _standbyPath == file.path && _isStandbyReady) {
      try {
        // Garante volume e inicia reprodução
        await _standby!.setVolume(1.0);
        await _standby!.seekTo(Duration.zero);
        await _standby!.play();
      } catch (e) {
        debugPrint('[AdVideoLayer] Error playing standby: $e');
      }

      if (mounted) {
        setState(() {
          _standbyOpacity = 1.0;
          _activeOpacity = 0.0;
        });
      }

      // Aguarda fade e troca controllers
      Future.delayed(_fadeDuration, () async {
        final old = _active;

        _active = _standby;
        _isActiveReady = _isStandbyReady;

        _standby = null;
        _standbyPath = null;
        _isStandbyReady = false;

        // Cleanup do controller antigo (com delay para evitar GC durante playback)
        Future.delayed(const Duration(seconds: 1), () async {
          if (old != null) {
            try {
              await old.pause();
              await old.dispose();
            } catch (e) {
              debugPrint('[AdVideoLayer] Error disposing old controller: $e');
            }
          }
        });

        if (mounted) {
          setState(() {
            _activeOpacity = 1.0;
            _standbyOpacity = 0.0;
          });
        }
      });
      return;
    }

    // Criar novo controller e preparar adequadamente
    debugPrint('[AdVideoLayer] Creating new controller for: ${file.path}');

    final ctrl = VideoPlayerController.file(
      file,
      videoPlayerOptions: VideoPlayerOptions(
        mixWithOthers: true,
        allowBackgroundPlayback: false,
      ),
    );

    // Marca como não pronto durante inicialização
    _isActiveReady = false;

    try {
      // Inicializa com buffer progressivo
      await _initController(ctrl, isStandby: false);

      // Guarda referência do controller antigo
      final oldActive = _active;
      _active = ctrl;

      // Mostra a camada antes de tocar para evitar flash
      if (mounted) {
        setState(() {
          _activeOpacity = 1.0;
          _standbyOpacity = 0.0;
        });
      }

      // Inicia reprodução imediatamente (buffer já carregado)
      await _active!.play();

      debugPrint('[AdVideoLayer] Playing: ${file.path}');

      // Dispose do controller antigo após 1 segundo (evita GC durante início)
      if (oldActive != null) {
        Future.delayed(const Duration(seconds: 1), () async {
          try {
            await oldActive.pause();
            await oldActive.dispose();
          } catch (e) {
            debugPrint('[AdVideoLayer] Error disposing old active: $e');
          }
        });
      }
    } catch (e) {
      debugPrint('[AdVideoLayer] Error initializing controller: $e');
      _isActiveReady = false;
    }
  }

  Future<void> prepareNext(File file) async {
    // Não prepara se já está preparado ou é o arquivo atual
    if (_standbyPath == file.path && _isStandbyReady) {
      debugPrint('[AdVideoLayer] Already prepared: ${file.path}');
      return;
    }

    if (_active != null) {
      final currentPath = (_active!.dataSource ?? '').replaceAll('file://', '');
      if (currentPath == file.path) {
        debugPrint('[AdVideoLayer] Cannot prepare current file as next');
        return;
      }
    }

    debugPrint('[AdVideoLayer] Preparing next: ${file.path}');

    try {
      // Dispose do standby anterior se existir
      if (_standby != null) {
        await _standby!.dispose();
        _standby = null;
        _isStandbyReady = false;
      }

      final next = VideoPlayerController.file(
        file,
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: true,
          allowBackgroundPlayback: false,
        ),
      );

      // Inicializa com buffer completo em background
      await _initController(next, isStandby: true);

      _standby = next;
      _standbyPath = file.path;

      debugPrint('[AdVideoLayer] Prepared: ${file.path}');
    } catch (e) {
      debugPrint('[AdVideoLayer] Error preparing next: $e');
      _isStandbyReady = false;
    }
  }

  Future<void> hide() async {
    debugPrint('[AdVideoLayer] Hiding video layer');

    try {
      await _active?.setVolume(0.0);
      await _active?.pause();
    } catch (e) {
      debugPrint('[AdVideoLayer] Error hiding active: $e');
    }

    try {
      await _standby?.setVolume(0.0);
      await _standby?.pause();
    } catch (e) {
      debugPrint('[AdVideoLayer] Error hiding standby: $e');
    }

    if (mounted) {
      setState(() {
        _activeOpacity = 0.0;
        _standbyOpacity = 0.0;
      });
    }
  }

  @override
  void dispose() {
    debugPrint('[AdVideoLayer] Disposing');
    try {
      _active?.dispose();
      _standby?.dispose();
    } catch (e) {
      debugPrint('[AdVideoLayer] Error during dispose: $e');
    }
    super.dispose();
  }

  Widget _buildVideoWidget(
    VideoPlayerController? controller,
    double opacity,
    String label,
  ) {
    if (controller == null || !controller.value.isInitialized) {
      return const SizedBox.shrink();
    }

    return AnimatedOpacity(
      opacity: opacity,
      duration: opacity == 0.0 ? _initialFadeDuration : _fadeDuration,
      curve: Curves.easeInOut,
      child: FittedBox(
        fit: BoxFit.cover,
        alignment: Alignment.center,
        child: SizedBox(
          width: controller.value.size.width,
          height: controller.value.size.height,
          child: VideoPlayer(controller),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: true,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _buildVideoWidget(_active, _activeOpacity, 'active'),
          _buildVideoWidget(_standby, _standbyOpacity, 'standby'),
        ],
      ),
    );
  }
}
