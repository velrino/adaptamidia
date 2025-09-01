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
  final Duration _fadeDuration = const Duration(milliseconds: 250);

  Future<void> _initController(VideoPlayerController controller) async {
    await controller.initialize();
    controller.setLooping(false);
  }

  Future<void> playFile(File file) async {
    // If standby prepared for this file, crossfade
    if (_standby != null && _standbyPath == file.path) {
      try {
        await _standby!.setVolume(1.0);
        await _standby!.play();
      } catch (_) {}
      if (mounted) {
        setState(() {
          _standbyOpacity = 1.0;
          _activeOpacity = 0.0;
        });
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
    await _active!.setVolume(1.0);
    await _active!.play();
    if (mounted) {
      setState(() {
        _activeOpacity = 1.0;
        _standbyOpacity = 0.0;
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
      await _standby!.setVolume(1.0);
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
        await _active!.setVolume(1.0);
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
              duration: _fadeDuration,
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
              duration: _fadeDuration,
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
