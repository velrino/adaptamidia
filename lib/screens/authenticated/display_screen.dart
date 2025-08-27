import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:async';
import '../../interfaces/display_unit.dart';
import '../../services/display_service.dart';

class DisplayScreen extends StatefulWidget {
  final String unitId;
  
  const DisplayScreen({
    super.key,
    required this.unitId,
  });

  @override
  State<DisplayScreen> createState() => _DisplayScreenState();
}

class _DisplayScreenState extends State<DisplayScreen> {
  bool _isLoading = true;
  String? _error;
  IDisplayUnit? _displayUnit;
  int _currentContentIndex = 0;
  Timer? _contentTimer;
  Timer? _progressTimer;
  double _progress = 0.0;
  DateTime? _contentStartTime;
  int _currentDuration = 0;
  VideoPlayerController? _videoController;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    _loadDisplayUnit();
  }

  @override
  void dispose() {
    _contentTimer?.cancel();
    _progressTimer?.cancel();
    _disposeVideoController();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  Future<void> _loadDisplayUnit() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final displayUnit = await DisplayService.instance.getDisplayUnit(widget.unitId);
      
      if (displayUnit != null && displayUnit.contents.isNotEmpty) {
        setState(() {
          _displayUnit = displayUnit;
          _isLoading = false;
        });
        
        if (mounted) {
          _startContentDisplay();
        }
      } else {
        setState(() {
          _error = 'Nenhum conteúdo encontrado para esta unidade';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar conteúdo: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _startContentDisplay() async {
    if (_displayUnit == null || _displayUnit!.contents.isEmpty || !mounted) return;

    // Cancel existing timers first
    _contentTimer?.cancel();
    _progressTimer?.cancel();

    final currentContent = _displayUnit!.contents[_currentContentIndex];
    
    _currentDuration = currentContent.type.toLowerCase() == 'news' 
        ? 5 
        : currentContent.seconds ?? 5;
    
    _contentStartTime = DateTime.now();
    
    // Setup media player
    await _setupMediaPlayer(currentContent);
    
    // Only proceed if still mounted
    if (!mounted) return;
    
    setState(() {
      _progress = 0.0;
    });

    // Start progress timer
    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      setState(() {
        _progress += 0.1 / _currentDuration;
        if (_progress >= 1.0) {
          _progress = 1.0;
          timer.cancel();
        }
      });
    });

    // Start content timer
    _contentTimer = Timer(Duration(seconds: _currentDuration), () {
      if (mounted) {
        _logContentCompletion();
        _nextContent();
      }
    });
  }

  Future<void> _setupMediaPlayer(IDisplayContent content) async {
    await _disposeVideoController();
    
    // Small delay to ensure proper cleanup
    await Future.delayed(const Duration(milliseconds: 200));

    if (content.type.toLowerCase() == 'advertisement' && mounted) {
      try {
        _videoController = VideoPlayerController.networkUrl(
          Uri.parse(content.url),
          videoPlayerOptions: VideoPlayerOptions(
            mixWithOthers: false,
            allowBackgroundPlayback: false,
            // Disable audio track to prevent codec initialization
            webOptions: const VideoPlayerWebOptions(
              allowRemotePlayback: false,
            ),
          ),
          httpHeaders: {
            'Connection': 'keep-alive',
          },
        );
        
        // Set volume to 0 before initialization to prevent audio codec
        _videoController!.setVolume(0.0);
        
        await _videoController!.initialize();
        
        if (mounted) {
          _videoController!.setLooping(false);
          // Add small delay before playing
          await Future.delayed(const Duration(milliseconds: 100));
          await _videoController!.play();
        }
      } catch (e) {
        await _disposeVideoController();
      }
    }
  }

  Future<void> _disposeVideoController() async {
    if (_videoController != null) {
      final controller = _videoController!;
      _videoController = null;
      
      try {
        // Stop playback first
        if (controller.value.isPlaying) {
          await controller.pause();
        }
        
        // Set volume to 0 to stop audio processing
        controller.setVolume(0.0);
        
        // Wait for buffering to complete
        if (controller.value.isBuffering) {
          await Future.delayed(const Duration(milliseconds: 200));
        }
        
        // Dispose controller
        await controller.dispose();
      } catch (e) {
        // Ignore dispose errors
      }
    }
  }

  void _logContentCompletion() {
    if (_displayUnit == null || _contentStartTime == null) return;

    final currentContent = _displayUnit!.contents[_currentContentIndex];
    
    DisplayService.instance.logContentCompletion(
      unitId: widget.unitId,
      contentId: currentContent.id,
      contentType: currentContent.type,
      contentTitle: currentContent.title,
      displayDuration: _currentDuration,
      startTime: _contentStartTime!,
      endTime: DateTime.now(),
    );
  }

  Future<void> _nextContent() async {
    if (_displayUnit == null || _displayUnit!.contents.isEmpty || !mounted) return;

    setState(() {
      _currentContentIndex = (_currentContentIndex + 1) % _displayUnit!.contents.length;
    });
    
    await _startContentDisplay();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) {
      return _buildLoadingState(isDark);
    }

    if (_error != null) {
      return _buildErrorState(isDark);
    }

    if (_displayUnit == null || _displayUnit!.contents.isEmpty) {
      return _buildEmptyState(isDark);
    }

    return _buildDisplayContent(isDark);
  }

  Widget _buildLoadingState(bool isDark) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.black,
      ),
    );
  }

  Widget _buildErrorState(bool isDark) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.black,
        child: Center(
          child: GestureDetector(
            onTap: _loadDisplayUnit,
            child: Container(
              width: double.infinity,
              height: double.infinity,
              color: Colors.black,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.black,
      ),
    );
  }

  Widget _buildDisplayContent(bool isDark) {
    final currentContent = _displayUnit!.contents[_currentContentIndex];
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned.fill(
            child: _buildMediaPlayer(currentContent),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildProgressBar(),
          ),
        ],
      ),
    );
  }

  Widget _buildMediaPlayer(IDisplayContent content) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.black,
      child: content.type.toLowerCase() == 'advertisement' && _videoController != null
          ? _buildVideoPlayer()
          : _buildImagePlayer(content),
    );
  }

  Widget _buildVideoPlayer() {
    if (_videoController == null || !_videoController!.value.isInitialized) {
      return Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.black,
      );
    }

    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.black,
      child: FittedBox(
        fit: BoxFit.cover,
        alignment: Alignment.center,
        child: SizedBox(
          width: _videoController!.value.size.width,
          height: _videoController!.value.size.height,
          child: VideoPlayer(_videoController!),
        ),
      ),
    );
  }

  Widget _buildImagePlayer(IDisplayContent content) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.black,
      child: content.type.toLowerCase() == 'news'
          ? _buildNewsContent(content)
          : _buildAdContent(content),
    );
  }

  Widget _buildNewsContent(IDisplayContent content) {
    return Stack(
      children: [
        // Background image - Full screen
        Positioned.fill(
          child: CachedNetworkImage(
            imageUrl: content.url,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            placeholder: (context, url) => _buildPlaceholder(),
            errorWidget: (context, url, error) => _buildFallbackContent(content),
            fadeInDuration: Duration.zero,
            fadeOutDuration: Duration.zero,
          ),
        ),
        // Text overlay
        _buildNewsOverlay(content),
      ],
    );
  }

  Widget _buildNewsOverlay(IDisplayContent content) {
    
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withValues(alpha: 0.8),
            ],
          ),
        ),
        padding: const EdgeInsets.fromLTRB(60, 120, 60, 60),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Title
            Text(
              content.title,
              style: const TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                height: 1.2,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            
            if (content.description != null && content.description!.isNotEmpty) ...[
              const SizedBox(height: 24),
              // Description
              Text(
                content.description!,
                style: TextStyle(
                  fontSize: 24,
                  color: Colors.white.withValues(alpha: 0.9),
                  height: 1.4,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            
            // Source and Author
            if (content.sourceName != null || content.author != null) ...[
              const SizedBox(height: 32),
              Row(
                children: [
                  if (content.sourceName != null) ...[
                    Text(
                      content.sourceName!,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                    if (content.author != null) ...[
                      Text(
                        ' • ',
                        style: TextStyle(
                          fontSize: 20,
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ],
                  if (content.author != null)
                    Expanded(
                      child: Text(
                        content.author!,
                        style: TextStyle(
                          fontSize: 20,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }


  Widget _buildAdContent(IDisplayContent content) {
    return Container(
      color: Colors.black,
      width: double.infinity,
      height: double.infinity,
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: Colors.black,
      width: double.infinity,
      height: double.infinity,
    );
  }

  Widget _buildFallbackContent(IDisplayContent content) {
    return Container(
      color: Colors.black,
      width: double.infinity,
      height: double.infinity,
    );
  }


  Widget _buildProgressBar() {
    return Container(
      height: 4,
      color: Colors.transparent,
      child: LinearProgressIndicator(
        value: _progress,
        backgroundColor: Colors.grey.withValues(alpha: 0.3),
        valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
      ),
    );
  }
}