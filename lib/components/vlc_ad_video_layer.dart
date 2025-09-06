import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_vlc_player/flutter_vlc_player.dart';

/// High-performance double-buffered video layer using VLC for smooth crossfades.
/// API mirrors AdVideoLayer: playFile, prepareNext, hide.
class VlcAdVideoLayer extends StatefulWidget {
  const VlcAdVideoLayer({super.key});

  @override
  State<VlcAdVideoLayer> createState() => VlcAdVideoLayerState();
}

class VlcAdVideoLayerState extends State<VlcAdVideoLayer> {
  VlcPlayerController? _active;
  VlcPlayerController? _standby;
  String? _standbyPath;

  double _activeOpacity = 0.0;
  double _standbyOpacity = 0.0;

  final Duration _fadeDuration = const Duration(milliseconds: 450);

  VlcPlayerController _createControllerForFile(File file) {
    final ctrl = VlcPlayerController.file(
      file,
      hwAcc: HwAcc.full,
      autoPlay: true,
      options: VlcPlayerOptions(
        advanced: VlcAdvancedOptions([
          // Zero caching for file playback; keep latency minimal
          VlcAdvancedOptions.fileCaching(0),
          VlcAdvancedOptions.liveCaching(0),
          VlcAdvancedOptions.networkCaching(0),
        ]),
        video: VlcVideoOptions([
          // Drop late frames and skip if needed to keep smoothness
          VlcVideoOptions.dropLateFrames(true),
          VlcVideoOptions.skipFrames(true),
        ]),
      ),
    );
    return ctrl;
  }

  Future<void> playFile(File file) async {
    // If standby prepared for this file, crossfade to it
    if (_standby != null && _standbyPath == file.path) {
      try {
        await _standby!.setVolume(100);
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
        _standby = null;
        _standbyPath = null;
        try {
          old?.stop();
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
    final ctrl = _createControllerForFile(file);
    if (_active != null) {
      try {
        await _active!.stop();
      } catch (_) {}
      unawaited(_active!.dispose());
    }
    _active = ctrl;
    // Mount, then initialize and play

    if (mounted) {
      setState(() {
        _activeOpacity = 1.0;
        _standbyOpacity = 0.0;
      });
    }

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        if (!mounted || _active != ctrl) return;
        await _active!.initialize();
        await _active!.setVolume(100);
        await Future.delayed(const Duration(milliseconds: 100));
        await _active!.play();
      } catch (_) {}
    });
  }

  Future<void> prepareNext(File file) async {
    try {
      final next = _createControllerForFile(file);
      await _standby?.dispose();
      _standby = next;
      _standbyPath = file.path;

      // Initialize after mount, then prebuffer muted
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        try {
          if (!mounted || _standby != next) return;
          await _standby!.initialize();
          await _standby!.setVolume(0);
          await _standby!.play();
          await Future.delayed(const Duration(milliseconds: 220));
          await _standby!.pause();
          try {
            await _standby!.seekTo(Duration.zero);
          } catch (_) {}
        } catch (_) {}
      });
    } catch (_) {}
  }

  Future<void> hide() async {
    try {
      await _active?.setVolume(0);
      await _active?.pause();
    } catch (_) {}
    try {
      await _standby?.setVolume(0);
      await _standby?.pause();
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
      _active?.removeListener(() {});
    } catch (_) {}
    try {
      _active?.stop();
    } catch (_) {}
    try {
      _active?.dispose();
    } catch (_) {}
    try {
      _standby?.removeListener(() {});
    } catch (_) {}
    try {
      _standby?.stop();
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
                  : Center(
                      child: AspectRatio(
                        aspectRatio:
                            (_active!.value.aspectRatio.isFinite &&
                                _active!.value.aspectRatio > 0)
                            ? _active!.value.aspectRatio
                            : (16 / 9),
                        child: VlcPlayer(
                          controller: _active!,
                          aspectRatio:
                              (_active!.value.aspectRatio.isFinite &&
                                  _active!.value.aspectRatio > 0)
                              ? _active!.value.aspectRatio
                              : (16 / 9),
                          placeholder: const SizedBox.shrink(),
                        ),
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
                  : Center(
                      child: AspectRatio(
                        aspectRatio:
                            (_standby!.value.aspectRatio.isFinite &&
                                _standby!.value.aspectRatio > 0)
                            ? _standby!.value.aspectRatio
                            : (16 / 9),
                        child: VlcPlayer(
                          controller: _standby!,
                          aspectRatio:
                              (_standby!.value.aspectRatio.isFinite &&
                                  _standby!.value.aspectRatio > 0)
                              ? _standby!.value.aspectRatio
                              : (16 / 9),
                          placeholder: const SizedBox.shrink(),
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
