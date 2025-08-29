import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../services/storage_service.dart';
import '../../services/video_cache_service.dart';
import '../../components/video_player_screen.dart';

class DisplayScreen extends StatefulWidget {
  final String unitId;

  const DisplayScreen({super.key, required this.unitId});

  @override
  State<DisplayScreen> createState() => _DisplayScreenState();
}

class _DisplayScreenState extends State<DisplayScreen> {
  List<dynamic> _contents = [];
  int _currentIndex = 0;
  Timer? _timer;
  Timer? _progressTimer;
  double _progress = 0.0;
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _unitData;

  @override
  void initState() {
    super.initState();
    _enterFullScreen();
    _loadContent();
    WakelockPlus.enable();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _progressTimer?.cancel();
    _exitFullScreen();
    WakelockPlus.disable();
    super.dispose();
  }

  void _enterFullScreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
  }

  void _exitFullScreen() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }

  Future<void> _loadContent() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final token = await StorageService.getAuthToken();
      if (token == null) {
        throw Exception('No auth token');
      }

      final url = 'https://9aca430ada6d.ngrok-free.app/display/unit/${widget.unitId}';
      
      debugPrint('📡 Fetching content from: $url');
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'ngrok-skip-browser-warning': 'true',
        },
      );

      debugPrint('Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('Response data: ${json.encode(data).substring(0, 200)}...');
        
        // Check if response has data array (new format)
        if (data['data'] != null && data['data'] is List) {
          // Pre-cache videos
          for (var content in data['data']) {
            if (content['type'] == 'ADVERTISEMENT' && content['ads'] != null) {
              final videoUrl = content['ads']['source'];
              if (videoUrl != null) {
                debugPrint('📥 Pre-caching video: $videoUrl');
                VideoCacheService.instance.getVideoFromCache(videoUrl);
              }
            }
          }
          
          setState(() {
            _unitData = data['unit'];
            _contents = data['data'];
            _isLoading = false;
          });
          
          if (_contents.isNotEmpty) {
            _startContent();
          }
        } else {
          throw Exception('Invalid response format - no data field found');
        }
      } else {
        throw Exception('Failed to load content: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ Error loading content: $e');
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  void _startContent() {
    if (_contents.isEmpty) return;
    
    _timer?.cancel();
    _progressTimer?.cancel();
    _progress = 0.0;
    
    final content = _contents[_currentIndex];
    final type = content['type'];
    
    debugPrint('🎬 Starting content: $type at index $_currentIndex');
    
    int duration = 5; // default for news
    
    if (type == 'ADVERTISEMENT' && content['ads'] != null) {
      duration = content['ads']['seconds'] ?? 30;
    }
    
    // Start progress timer
    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _progress = timer.tick * 100 / (duration * 1000);
      });
    });
    
    // Auto advance timer
    _timer = Timer(Duration(seconds: duration), () {
      if (!mounted) return;
      _nextContent();
    });
  }
  
  void _nextContent() {
    setState(() {
      _currentIndex = (_currentIndex + 1) % _contents.length;
    });
    _startContent();
  }

  Widget _buildContent() {
    if (_contents.isEmpty) {
      return const Center(
        child: Text(
          'Sem conteúdo disponível',
          style: TextStyle(color: Colors.white, fontSize: 24),
        ),
      );
    }
    
    final content = _contents[_currentIndex];
    final type = content['type'];
    
    if (type == 'NEWS' && content['news'] != null) {
      return _buildNews(content['news']);
    } else if (type == 'ADVERTISEMENT' && content['ads'] != null) {
      return _buildAdvertisement(content['ads']);
    }
    
    return Container();
  }

  Widget _buildNews(Map<String, dynamic> news) {
    final imageUrl = news['image'] ?? '';
    final title = news['title'] ?? '';
    final description = news['description'] ?? '';
    final sourceName = news['source_name'] ?? '';
    final author = news['author'] ?? '';
    
    return Stack(
      fit: StackFit.expand,
      children: [
        // Background image
        Positioned.fill(
          child: CachedNetworkImage(
            imageUrl: imageUrl,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            placeholder: (context, url) => Container(color: Colors.black),
            errorWidget: (context, url, error) => Container(color: Colors.black),
          ),
        ),
        // Overlay with content
        Positioned(
          bottom: 24,
          left: 24,
          right: 24,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withOpacity(0.8),
                  Colors.black.withOpacity(0.6),
                ],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.5),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
              border: Border.all(
                color: Colors.white.withOpacity(0.1),
                width: 1,
              ),
            ),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  // Logo
                  Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(15),
                      child: Image.asset(
                        'assets/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[800],
                            child: const Icon(
                              Icons.image,
                              color: Colors.white54,
                              size: 80,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  // Divider
                  Container(
                    width: 1,
                    height: double.infinity,
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    color: Colors.white.withOpacity(0.2),
                  ),
                  // Text content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          description,
                          style: TextStyle(
                            color: Colors.grey[300],
                            fontSize: 20,
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (sourceName.isNotEmpty || author.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(
                                Icons.newspaper,
                                color: Colors.grey[400],
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  [sourceName, author]
                                      .where((s) => s.isNotEmpty)
                                      .join(' • '),
                                  style: TextStyle(
                                    color: Colors.grey[400],
                                    fontSize: 16,
                                    fontStyle: FontStyle.italic,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAdvertisement(Map<String, dynamic> ads) {
    final videoUrl = ads['source'] ?? '';
    final title = ads['title'] ?? '';
    
    if (videoUrl.isEmpty) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Text(
            title,
            style: const TextStyle(color: Colors.white, fontSize: 24),
          ),
        ),
      );
    }
    
    // Use the dedicated video player screen
    return VideoPlayerScreen(
      videoUrl: videoUrl,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Main content
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            )
          else if (_error != null)
            GestureDetector(
              onTap: _loadContent,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Colors.white,
                      size: 64,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erro ao carregar conteúdo',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Toque para tentar novamente',
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            _buildContent(),
          
          // Progress bar
          if (!_isLoading && _error == null && _contents.isNotEmpty)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                value: _progress.clamp(0.0, 1.0),
                backgroundColor: Colors.white.withOpacity(0.1),
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                minHeight: 3,
              ),
            ),
        ],
      ),
    );
  }
}