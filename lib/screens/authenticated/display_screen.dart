// display_playlist_screen.dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_vlc_player/flutter_vlc_player.dart';
import 'package:http/http.dart' as http;
import '../../services/storage_service.dart';

/// TODO: ajuste este token se necessário.
/// (coloque em storage seguro em produção)
const _authToken =
    'Bearer REDACTED';

/// Modelos simples
enum ItemType { news, ad }

class PlaylistItem {
  final ItemType type;
  // NEWS
  final String? title;
  final String? description;
  final String? author;
  final String? sourceName;
  final String? imageUrl;
  // AD
  final String? mediaUrl; // para AD (vídeo ou imagem)
  final bool isVideo;
  final int seconds;

  PlaylistItem.news({
    required this.title,
    required this.description,
    required this.author,
    required this.sourceName,
    required this.imageUrl,
  }) : type = ItemType.news,
       seconds = 5,
       mediaUrl = null,
       isVideo = false;

  PlaylistItem.ad({
    required this.mediaUrl,
    required this.isVideo,
    required this.seconds,
  }) : type = ItemType.ad,
       title = null,
       description = null,
       author = null,
       sourceName = null,
       imageUrl = null;
}

/// Tela principal
class DisplayPlaylistScreen extends StatefulWidget {
  final String unitId;
  const DisplayPlaylistScreen({super.key, required this.unitId});

  @override
  State<DisplayPlaylistScreen> createState() => _DisplayPlaylistScreenState();
}

class _DisplayPlaylistScreenState extends State<DisplayPlaylistScreen> {
  bool _isLoading = true;
  String? _error;
  bool _isLandscape = true; // default; será sobrescrito por config

  final List<PlaylistItem> _items = [];
  int _index = 0;
  Timer? _timer;

  VlcPlayerController? _vlc;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _disposeVlc();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      // 1) Respeitar config.isLandscape
      final config = await StorageService.getDeviceConfig();
      _isLandscape = config?.isLandscape ?? true;

      // Sugestão: fixe a orientação se quiser obrigar.
      // Se preferir apenas adaptar layout sem travar, remova estas linhas:
      await SystemChrome.setPreferredOrientations(
        _isLandscape
            ? [
                DeviceOrientation.landscapeLeft,
                DeviceOrientation.landscapeRight,
              ]
            : [DeviceOrientation.portraitUp, DeviceOrientation.portraitDown],
      );

      // 2) Buscar dados

      final url =
          'https://9aca430ada6d.ngrok-free.app/display/unit/${widget.unitId}';
      final resp = await http.get(
        Uri.parse(url),
        headers: {'Authorization': _authToken},
      );
      if (resp.statusCode != 200) {
        throw Exception('HTTP ${resp.statusCode}');
      }
      final jsonMap = json.decode(resp.body) as Map<String, dynamic>;
      final List<dynamic> data = jsonMap['data'] as List<dynamic>;

      // 3) Parsear para playlist
      for (final raw in data) {
        final type = (raw['type'] as String?) ?? '';
        if (type == 'NEWS') {
          final n = raw['news'] as Map<String, dynamic>;
          _items.add(
            PlaylistItem.news(
              title: (n['title'] ?? '') as String,
              description: (n['description'] ?? '') as String,
              author: (n['author'] ?? '') as String,
              sourceName: (n['source_name'] ?? '') as String,
              imageUrl: (n['image'] ?? n['url']) as String?,
            ),
          );
        } else if (type == 'ADVERTISEMENT') {
          final a = raw['ads'] as Map<String, dynamic>;
          final source = (a['source'] ?? '') as String;
          final mediaType = (a['type'] ?? 'VIDEO') as String;
          final secs = (a['seconds'] ?? 10) as int;
          final isVideo =
              mediaType.toUpperCase() == 'VIDEO' ||
              source.toLowerCase().endsWith('.mp4') ||
              source.toLowerCase().endsWith('.m3u8');
          _items.add(
            PlaylistItem.ad(mediaUrl: source, isVideo: isVideo, seconds: secs),
          );
        }
      }

      if (_items.isEmpty) {
        throw Exception('Playlist vazia');
      }

      // 4) Começar reprodução
      setState(() {
        _isLoading = false;
        _error = null;
      });
      _playCurrent();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Falha ao iniciar: $e';
      });
    }
  }

  void _disposeVlc() {
    try {
      _vlc?.stop();
      _vlc?.dispose();
    } catch (_) {}
    _vlc = null;
  }

  void _playCurrent() {
    _timer?.cancel();
    _disposeVlc();

    final item = _items[_index];

    if (item.type == ItemType.ad && item.isVideo && item.mediaUrl != null) {
      // Vídeo AD: usar VLC + overscan leve para eliminar “bordas verdes”
      _vlc = VlcPlayerController.network(
        item.mediaUrl!,
        hwAcc: HwAcc.auto, // em boxes problemáticas: HwAcc.disabled
        autoPlay: true,
        options: VlcPlayerOptions(
          advanced: VlcAdvancedOptions([
            ':no-drop-late-frames',
            ':no-skip-frames',
            // Em devices antigos: descomente para forçar RGB
            // ':android-display-chroma=RV32',
          ]),
        ),
      );
    }

    // NEWS = 5s; AD = seconds do item
    final int seconds = item.seconds;
    _timer = Timer(Duration(seconds: seconds), _next);
    setState(() {});
  }

  void _next() {
    _index = (_index + 1) % _items.length;
    _playCurrent();
  }

  // ------- UI helpers -------

  double _fullScreenAspectRatio(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return size.width / size.height;
  }

  Widget _buildVideo() {
    final ctrl = _vlc;
    if (ctrl == null) {
      // Não inicializado ainda (ou AD imagem)
      return const Center(child: CircularProgressIndicator());
    }
    // Overscan + recorte para esconder artefatos
    return LayoutBuilder(
      builder: (context, constraints) {
        return ClipRect(
          child: Container(
            color: Colors.black,
            alignment: Alignment.center,
            child: Transform.scale(
              scale: 1.03, // 3% a mais pra cortar bordas
              child: AspectRatio(
                aspectRatio: _fullScreenAspectRatio(context),
                child: VlcPlayer(
                  controller: ctrl,
                  aspectRatio: _fullScreenAspectRatio(context),
                  placeholder: const Center(child: CircularProgressIndicator()),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildImage(String url) {
    return Container(
      color: Colors.black,
      child: ClipRect(
        child: FittedBox(
          fit: BoxFit.cover,
          child: Image.network(url, fit: BoxFit.cover),
        ),
      ),
    );
  }

  Widget _buildNewsOverlay({
    required String title,
    required String description,
    required String author,
    required String source,
  }) {
    // Layouts diferentes para landscape/portrait
    final isL = _isLandscape;

    final textColor = Colors.white;
    final shadow = [
      const Shadow(color: Colors.black54, blurRadius: 6, offset: Offset(0, 1)),
    ];

    final info = Column(
      crossAxisAlignment: isL
          ? CrossAxisAlignment.start
          : CrossAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          source,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: textColor.withOpacity(0.9),
            fontSize: isL ? 16 : 14,
            fontWeight: FontWeight.w600,
            shadows: shadow,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          title,
          maxLines: isL ? 2 : 3,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: textColor,
            fontSize: isL ? 26 : 22,
            fontWeight: FontWeight.w800,
            height: 1.1,
            shadows: shadow,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          description,
          maxLines: isL ? 2 : 4,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: textColor.withOpacity(0.95),
            fontSize: isL ? 16 : 15,
            height: 1.25,
            shadows: shadow,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          author.isEmpty ? '' : 'Por $author',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: textColor.withOpacity(0.85),
            fontSize: isL ? 14 : 13,
            fontWeight: FontWeight.w500,
            shadows: shadow,
          ),
        ),
      ],
    );

    // Gradiente e padding adaptativos
    final gradient = Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(
          horizontal: isL ? 28 : 18,
          vertical: isL ? 22 : 16,
        ),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.transparent, Colors.black54, Colors.black87],
          ),
        ),
        child: info,
      ),
    );

    return gradient;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text(
            _error!,
            style: const TextStyle(color: Colors.white),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    final item = _items[_index];

    Widget content;
    if (item.type == ItemType.ad) {
      if (item.isVideo && item.mediaUrl != null) {
        content = _buildVideo();
      } else {
        // fallback para imagem de anúncio (se algum vier como imagem)
        content = _buildImage(item.mediaUrl ?? '');
      }
    } else {
      // NEWS: sempre imagem + overlay
      content = Stack(
        fit: StackFit.expand,
        children: [
          _buildImage(item.imageUrl ?? ''),
          _buildNewsOverlay(
            title: item.title ?? '',
            description: item.description ?? '',
            author: item.author ?? '',
            source: item.sourceName ?? '',
          ),
        ],
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(top: false, bottom: false, child: content),
    );
  }
}

/// Stub do seu StorageService (substitua pelo real do seu projeto)
class DeviceConfig {
  final bool isLandscape;
  DeviceConfig(this.isLandscape);
}
