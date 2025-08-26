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
    _videoController?.dispose();
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
        
        _startContentDisplay();
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
    if (_displayUnit == null || _displayUnit!.contents.isEmpty) return;

    final currentContent = _displayUnit!.contents[_currentContentIndex];
    
    _currentDuration = currentContent.type.toLowerCase() == 'news' 
        ? 5 
        : currentContent.seconds ?? 5;
    
    _contentStartTime = DateTime.now();
    
    await _setupMediaPlayer(currentContent);
    
    setState(() {
      _progress = 0.0;
    });

    _progressTimer?.cancel();
    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      setState(() {
        _progress += 0.1 / _currentDuration;
        if (_progress >= 1.0) {
          _progress = 1.0;
          timer.cancel();
        }
      });
    });

    _contentTimer?.cancel();
    _contentTimer = Timer(Duration(seconds: _currentDuration), () {
      _logContentCompletion();
      _nextContent();
    });
  }

  Future<void> _setupMediaPlayer(IDisplayContent content) async {
    _videoController?.dispose();
    _videoController = null;

    if (content.type.toLowerCase() == 'advertisement') {
      _videoController = VideoPlayerController.networkUrl(Uri.parse(content.url));
      await _videoController!.initialize();
      _videoController!.setVolume(0.0);
      _videoController!.setLooping(false);
      _videoController!.play();
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
    if (_displayUnit == null || _displayUnit!.contents.isEmpty) return;

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
      backgroundColor: isDark ? Colors.black : Colors.white,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              'Carregando conteúdo...',
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(bool isDark) {
    return Scaffold(
      backgroundColor: isDark ? Colors.black : Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: Colors.red[600],
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDisplayUnit,
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Scaffold(
      backgroundColor: isDark ? Colors.black : Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.tv_off,
              size: 48,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhum conteúdo disponível',
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                fontSize: 16,
              ),
            ),
          ],
        ),
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
      child: Center(
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: content.type.toLowerCase() == 'advertisement' && _videoController != null
              ? VideoPlayer(_videoController!)
              : _buildImagePlayer(content),
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
          ? CachedNetworkImage(
              imageUrl: content.url,
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
              placeholder: (context, url) => Container(
                color: Colors.grey[900],
                child: const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                ),
              ),
              errorWidget: (context, url, error) => Container(
                color: Colors.grey[900],
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.article,
                      size: 64,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Text(
                        content.title,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (content.description != null) ...[
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          content.description!,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[400],
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            )
          : Container(
              color: Colors.grey[900],
              child: const Center(
                child: Icon(
                  Icons.play_circle_filled,
                  size: 64,
                  color: Colors.white,
                ),
              ),
            ),
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