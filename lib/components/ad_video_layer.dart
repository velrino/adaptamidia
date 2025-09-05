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
  String? _activePath;
  String? _standbyPath;
  double _activeOpacity = 0.0;
  double _standbyOpacity = 0.0;
  bool _isPreBuffering = false;
  final Duration _fadeDuration = const Duration(milliseconds: 500);
  final Duration _initialFadeDuration = const Duration(milliseconds: 800);

  Future<void> _initController(VideoPlayerController controller) async {
    await controller.initialize();
    controller.setLooping(false);
    // Sempre mudo para evitar problemas com codec de áudio
    await controller.setVolume(0.0);
    
    // Pré-buffer: avança um frame para carregar o vídeo na memória
    await controller.seekTo(Duration.zero);
    
    // Aguarda o primeiro frame estar pronto
    if (!controller.value.isInitialized) {
      await Future.delayed(const Duration(milliseconds: 100));
    }
  }

  Future<void> playFile(File file) async {
    // If standby prepared for this file, crossfade
    if (_standby != null && _standbyPath == file.path) {
      try {
        await _standby!.setVolume(0.0);
        // Pequeno delay para garantir que o vídeo está pronto
        await Future.delayed(const Duration(milliseconds: 50));
        await _standby!.play();
      } catch (_) {}
      if (mounted) {
        // Fade-in suave do novo vídeo
        setState(() {
          _standbyOpacity = 0.0;
        });
        await Future.delayed(const Duration(milliseconds: 50));
        if (mounted) {
          setState(() {
            _standbyOpacity = 1.0;
            _activeOpacity = 0.0;
          });
        }
      }
      Future.delayed(_fadeDuration, () {
        final old = _active;
        _active = _standby;
        _activePath = _standbyPath;
        _standby = null;
        _standbyPath = null;
        try { old?.pause(); } catch (_) {}
        unawaited(old?.dispose());
        if (mounted) {
          setState(() {
            _activeOpacity = 1.0;
            _standbyOpacity = 0.0;
          });
        }
      });
      return;
    }

    // Otherwise create active and show
    final ctrl = VideoPlayerController.file(
      file,
      videoPlayerOptions: VideoPlayerOptions(
        mixWithOthers: true,
        allowBackgroundPlayback: false,
      ),
    );
    await _initController(ctrl);
    if (_active != null) {
      try { await _active!.pause(); } catch (_) {}
      unawaited(_active!.dispose());
    }
    _active = ctrl;
    _activePath = file.path;
    await _active!.setVolume(0.0);
    
    // Inicia com opacidade 0 para fade-in suave
    if (mounted) {
      setState(() {
        _activeOpacity = 0.0;
        _standbyOpacity = 0.0;
      });
    }
    
    // Pequeno delay antes de iniciar para garantir buffering
    await Future.delayed(const Duration(milliseconds: 100));
    await _active!.play();
    
    // Fade-in suave do vídeo
    await Future.delayed(const Duration(milliseconds: 50));
    if (mounted) {
      setState(() {
        _activeOpacity = 1.0;
      });
    }
  }

  Future<void> prepareNext(File file) async {
    try {
      final next = VideoPlayerController.file(
        file,
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: true,
          allowBackgroundPlayback: false,
        ),
      );
      await _initController(next);
      _standby?.dispose();
      _standby = next;
      _standbyPath = file.path;
      await _standby!.setVolume(0.0);
      
      // Pré-carrega alguns segundos do vídeo para evitar travamento
      _isPreBuffering = true;
      await _standby!.play();
      await Future.delayed(const Duration(milliseconds: 200));
      await _standby!.pause();
      await _standby!.seekTo(Duration.zero);
      _isPreBuffering = false;
    } catch (_) {}
  }

  Future<void> swapToStandbyAndPlay() async {
    if (_standby == null) return;
    final old = _active;
    _active = _standby;
    _standby = null;
    _activePath = _standbyPath;
    _standbyPath = null;
    try {
      if (_active != null) {
        await _active!.setVolume(0.0);
        await Future.delayed(const Duration(milliseconds: 50));
        await _active!.play();
      }
    } catch (_) {}
    try { await old?.pause(); } catch (_) {}
    unawaited(old?.dispose());
    if (mounted) {
      setState(() {
        _activeOpacity = 1.0;
        _standbyOpacity = 0.0;
      });
    }
  }

  Future<void> hide() async {
    try { await _active?.setVolume(0.0); await _active?.pause(); } catch (_) {}
    try { await _standby?.setVolume(0.0); await _standby?.pause(); } catch (_) {}
    if (mounted) setState(() { _activeOpacity = 0.0; _standbyOpacity = 0.0; });
  }

  @override
  void dispose() {
    try {
      _active?.dispose();
      _standby?.dispose();
    } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: true,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (_active != null && _active!.value.isInitialized)
            AnimatedOpacity(
              opacity: _activeOpacity,
              duration: _activeOpacity == 0.0 ? _initialFadeDuration : _fadeDuration,
              curve: Curves.easeInOut,
              child: FittedBox(
                fit: BoxFit.cover,
                alignment: Alignment.center,
                child: SizedBox(
                  width: _active!.value.size.width,
                  height: _active!.value.size.height,
                  child: VideoPlayer(_active!),
                ),
              ),
            ),
          if (_standby != null && _standby!.value.isInitialized)
            AnimatedOpacity(
              opacity: _standbyOpacity,
              duration: _standbyOpacity == 0.0 ? _initialFadeDuration : _fadeDuration,
              curve: Curves.easeInOut,
              child: FittedBox(
                fit: BoxFit.cover,
                alignment: Alignment.center,
                child: SizedBox(
                  width: _standby!.value.size.width,
                  height: _standby!.value.size.height,
                  child: VideoPlayer(_standby!),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
