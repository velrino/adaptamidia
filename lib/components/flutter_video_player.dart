import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../services/video_cache_service.dart';

class FlutterVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final VoidCallback? onComplete;
  
  const FlutterVideoPlayer({
    super.key,
    required this.videoUrl,
    this.onComplete,
  });

  @override
  State<FlutterVideoPlayer> createState() => _FlutterVideoPlayerState();
}

class _FlutterVideoPlayerState extends State<FlutterVideoPlayer> {
  VideoPlayerController? _controller;
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
      final cachedFile = await VideoCacheService.instance.getVideoFromCache(widget.videoUrl);
      
      if (cachedFile != null && await cachedFile.exists()) {
        debugPrint('🎬 Flutter Video Player loading local file: ${cachedFile.path}');
        
        // Create controller with local file
        _controller = VideoPlayerController.file(cachedFile);
      } else {
        // Fallback to network
        debugPrint('⚠️ Cache miss, falling back to network: ${widget.videoUrl}');
        _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
      }
      
      // Add listener for completion
      _controller!.addListener(_videoListener);
      
      // Initialize
      await _controller!.initialize();
      
      // Mute and play
      await _controller!.setVolume(0.0);
      await _controller!.play();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
          _isBuffering = false;
        });
      }
      
      debugPrint('✅ Flutter Video Player initialized successfully');
      
    } catch (e) {
      debugPrint('❌ Error with Flutter Video Player: $e');
      setState(() {
        _error = e.toString();
        _isBuffering = false;
      });
    }
  }

  void _videoListener() {
    if (!mounted || _controller == null) return;
    
    final value = _controller!.value;
    
    // Check for end of video
    if (value.position >= value.duration && value.duration.inMilliseconds > 0) {
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
      _controller?.pause();
      _controller?.dispose();
    } catch (e) {
      debugPrint('⚠️ Error disposing Flutter Video Player: $e');
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Icon(
            Icons.error_outline,
            color: Colors.grey[600],
            size: 48,
          ),
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
        if (_controller != null && _controller!.value.isInitialized)
          Positioned.fill(
            child: FittedBox(
              fit: BoxFit.cover,
              alignment: Alignment.center,
              child: SizedBox(
                width: _controller!.value.size.width,
                height: _controller!.value.size.height,
                child: VideoPlayer(_controller!),
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