import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_vlc_player/flutter_vlc_player.dart';
import '../services/video_cache_service.dart';

class VlcVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final VoidCallback? onComplete;

  const VlcVideoPlayer({super.key, required this.videoUrl, this.onComplete});

  @override
  State<VlcVideoPlayer> createState() => _VlcVideoPlayerState();
}

class _VlcVideoPlayerState extends State<VlcVideoPlayer> {
  VlcPlayerController? _controller;
  bool _isInitialized = false;
  bool _isBuffering = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    try {
      // Get cached video file
      final cachedFile = await VideoCacheService.instance.getVideoFromCache(
        widget.videoUrl,
      );

      if (cachedFile != null && await cachedFile.exists()) {
        debugPrint('🎬 VLC loading local file: ${cachedFile.path}');

        // Use VlcPlayerController.file() with File object as documented
        _controller = VlcPlayerController.file(
          cachedFile,
          hwAcc: HwAcc.full,
          autoPlay: true,
          options: VlcPlayerOptions(
            advanced: VlcAdvancedOptions([
              VlcAdvancedOptions.networkCaching(0),
              VlcAdvancedOptions.fileCaching(0),
              VlcAdvancedOptions.liveCaching(0),
            ]),
            video: VlcVideoOptions([
              VlcVideoOptions.dropLateFrames(true),
              VlcVideoOptions.skipFrames(true),
            ]),
          ),
        );

        // Add listeners
        _controller!.addListener(_videoListener);

        // Initialize
        await _controller!.initialize();

        // Mute
        await _controller!.setVolume(100);

        if (mounted) {
          setState(() {
            _isInitialized = true;
            _isBuffering = false;
          });
        }

        debugPrint('✅ VLC initialized with file://${cachedFile.path}');
      } else {
        // Fallback to network if cache fails
        debugPrint(
          '⚠️ Cache miss, falling back to network: ${widget.videoUrl}',
        );
        _initializeNetworkPlayer();
      }
    } catch (e) {
      debugPrint('❌ Error with VLC file player: $e');
      // Fallback to network
      _initializeNetworkPlayer();
    }
  }

  void _initializeNetworkPlayer() {
    try {
      _controller = VlcPlayerController.network(
        widget.videoUrl,
        hwAcc: HwAcc.full,
        autoPlay: true,
        options: VlcPlayerOptions(
          advanced: VlcAdvancedOptions([
            VlcAdvancedOptions.networkCaching(2000),
          ]),
        ),
      );

      _controller!.addListener(_videoListener);
      _controller!.initialize().then((_) {
        _controller!.setVolume(100);
        if (mounted) {
          setState(() {
            _isInitialized = true;
            _isBuffering = false;
          });
        }
      });
    } catch (e) {
      debugPrint('❌ Network player error: $e');
      setState(() {
        _error = e.toString();
        _isBuffering = false;
      });
    }
  }

  void _videoListener() {
    if (!mounted) return;

    final value = _controller!.value;

    // Check for end of video
    if (value.isEnded) {
      widget.onComplete?.call();
    }

    // Update buffering state
    if (value.isBuffering != _isBuffering) {
      setState(() {
        _isBuffering = value.isBuffering;
      });
    }
  }

  @override
  void dispose() {
    try {
      _controller?.removeListener(_videoListener);
      if (_controller != null && _isInitialized) {
        _controller?.stop();
        _controller?.dispose();
      }
    } catch (e) {
      debugPrint('⚠️ Error disposing VLC controller: $e');
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Icon(Icons.error_outline, color: Colors.grey[600], size: 48),
        ),
      );
    }

    if (!_isInitialized) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(
            color: Colors.white30,
            strokeWidth: 2,
          ),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Container(color: Colors.black),
        if (_controller != null)
          Center(
            child: AspectRatio(
              aspectRatio: _controller!.value.aspectRatio,
              child: VlcPlayer(
                controller: _controller!,
                aspectRatio: _controller!.value.aspectRatio,
                placeholder: Container(color: Colors.black),
              ),
            ),
          ),
        if (_isBuffering)
          Container(
            color: Colors.black54,
            child: const Center(
              child: CircularProgressIndicator(
                color: Colors.white30,
                strokeWidth: 2,
              ),
            ),
          ),
      ],
    );
  }
}
