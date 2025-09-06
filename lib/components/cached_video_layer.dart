import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:cached_video_player_plus/cached_video_player_plus.dart';
import 'package:video_player/video_player.dart';

/// Lightweight video layer based on cached_video_player_plus
/// Provides a minimal API compatible with AdVideoLayer for easy swap/rollback.
class CachedVideoLayer extends StatefulWidget {
  const CachedVideoLayer({super.key});

  @override
  State<CachedVideoLayer> createState() => CachedVideoLayerState();
}

class CachedVideoLayerState extends State<CachedVideoLayer> {
  CachedVideoPlayerPlus? _active;
  CachedVideoPlayerPlus? _standby;
  String? _standbyPath;

  double _activeOpacity = 0.0;
  double _standbyOpacity = 0.0;

  final Duration _fadeDuration = const Duration(milliseconds: 400);

  Future<void> _initPlayer(CachedVideoPlayerPlus player) async {
    await player.initialize();
    await player.controller.setLooping(false);
    // Keep default volume; mute only during prebuffer/hide
    await player.controller.setVolume(1.0);
    // Ensure positioned at start
    await player.controller.seekTo(Duration.zero);
  }

  Future<void> playFile(File file) async {
    // If a standby is prepared for this file, crossfade to it
    if (_standby != null && _standbyPath == file.path) {
      try {
        await _standby!.controller.setVolume(1.0);
        await _standby!.controller.play();
      } catch (_) {}
      if (mounted) {
        setState(() {
          _standbyOpacity = 1.0;
          _activeOpacity = 0.0;
        });
      }
      Future.delayed(_fadeDuration, () async {
        final old = _active;
        _active = _standby;
        _standby = null;
        _standbyPath = null;
        try {
          final c = old?.controller;
          if (c != null) {
            await c.pause();
          }
        } catch (_) {}
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

    // Otherwise create a new active controller and show
    final player = CachedVideoPlayerPlus.file(file);
    await _initPlayer(player);
    if (_active != null) {
      try { await _active!.controller.pause(); } catch (_) {}
      unawaited(_active!.dispose());
    }
    _active = player;
    await _active!.controller.setVolume(1.0);

    if (mounted) {
      setState(() {
        _activeOpacity = 1.0;
        _standbyOpacity = 0.0;
      });
    }

    // Small delay to ensure buffering before play, keeping layer visible
    await Future.delayed(const Duration(milliseconds: 100));
    await _active!.controller.play();
  }

  Future<void> prepareNext(File file) async {
    try {
      final next = CachedVideoPlayerPlus.file(file);
      await _initPlayer(next);
      await _standby?.dispose();
      _standby = next;
      _standbyPath = file.path;

      // Prebuffer a bit muted to avoid audio leak
      await _standby!.controller.setVolume(0.0);
      await _standby!.controller.play();
      await Future.delayed(const Duration(milliseconds: 200));
      await _standby!.controller.pause();
      await _standby!.controller.seekTo(Duration.zero);
    } catch (_) {}
  }

  Future<void> hide() async {
    try {
      final a = _active?.controller;
      if (a != null) {
        await a.setVolume(0.0);
        await a.pause();
      }
    } catch (_) {}
    try {
      final s = _standby?.controller;
      if (s != null) {
        await s.setVolume(0.0);
        await s.pause();
      }
    } catch (_) {}
    if (mounted) {
      setState(() {
        _activeOpacity = 0.0;
        _standbyOpacity = 0.0;
      });
    }
  }

  @override
  void dispose() {
    try {
      _active?.dispose();
    } catch (_) {}
    try {
      _standby?.dispose();
    } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Active layer
            AnimatedOpacity(
              opacity: _activeOpacity,
              duration: _fadeDuration,
              curve: Curves.easeInOut,
              child: _active == null
                  ? const SizedBox.shrink()
                  : FittedBox(
                      fit: BoxFit.cover,
                      child: SizedBox(
                        width: _active!.controller.value.size.width,
                        height: _active!.controller.value.size.height,
                        child: VideoPlayer(_active!.controller),
                      ),
                    ),
            ),
            // Standby layer
            AnimatedOpacity(
              opacity: _standbyOpacity,
              duration: _fadeDuration,
              curve: Curves.easeInOut,
              child: _standby == null
                  ? const SizedBox.shrink()
                  : FittedBox(
                      fit: BoxFit.cover,
                      child: SizedBox(
                        width: _standby!.controller.value.size.width,
                        height: _standby!.controller.value.size.height,
                        child: VideoPlayer(_standby!.controller),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
