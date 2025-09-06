import 'dart:io';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

/// Componente isolado para reprodução de vídeos via WebView
/// Solução mais estável que VLC para vídeos fullscreen
/// Suporta Portrait/Landscape com diferentes comportamentos de crop
class VideoPlayerScreen extends StatefulWidget {
  final String videoUrl;
  final VoidCallback? onVideoEnded;
  final Duration? duration;
  final bool isLandscape;
  
  const VideoPlayerScreen({
    super.key,
    required this.videoUrl,
    this.onVideoEnded,
    this.duration,
    this.isLandscape = true,
  });
  
  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }
  
  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            
            // Inicia o vídeo automaticamente
            _controller.runJavaScript('startVideo()');
            
            // Se tem duração definida, agenda callback
            if (widget.duration != null) {
              Future.delayed(widget.duration!, () {
                if (mounted && widget.onVideoEnded != null) {
                  widget.onVideoEnded!();
                }
              });
            }
          },
        ),
      );
    
    // Permite debugging para URLs file://
    if (Platform.isAndroid) {
      AndroidWebViewController.enableDebugging(true);
    }
    
    _controller.loadHtmlString(_generateVideoHtml());
  }
  
  /// Gera HTML otimizado para reprodução fullscreen
  String _generateVideoHtml() {
    return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      background-color: #000000;
      overflow: hidden;
    }
    
    #videoContainer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #000000;
    }
    
    #mainVideo {
      width: 100%;
      height: 100%;
      object-fit: ${widget.isLandscape ? 'contain' : 'cover'}; /* Landscape: normal, Portrait: crop fullscreen */
      background-color: #000000;
    }
    
    /* Remove controles do vídeo */
    #mainVideo::-webkit-media-controls {
      display: none !important;
    }
    
    #mainVideo::-webkit-media-controls-panel {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="videoContainer">
    <video 
      id="mainVideo"
      preload="metadata"
      muted
      autoplay
      loop
      playsinline
      webkit-playsinline
    >
      <source src="${widget.videoUrl}" type="video/mp4">
      Seu navegador não suporta vídeos HTML5.
    </video>
  </div>
  
  <script>
    const video = document.getElementById('mainVideo');
    
    // Função chamada pelo Flutter para iniciar vídeo
    function startVideo() {
      console.log('🎬 Iniciando vídeo: ${widget.videoUrl}');
      
      video.currentTime = 0;
      video.muted = true; // Garantir sem áudio
      
      // Força load antes de play (necessário para file://)
      video.load();
      
      // Aguarda um pouco para carregar metadados
      setTimeout(() => {
        video.play().then(() => {
          console.log('✅ Vídeo iniciado com sucesso');
        }).catch((error) => {
          console.error('❌ Erro ao iniciar vídeo:', error);
          console.log('Video readyState:', video.readyState);
          console.log('Video src:', video.src);
          console.log('Video currentSrc:', video.currentSrc);
          
          // Fallback: tenta novamente após pequeno delay
          setTimeout(() => {
            video.play().catch(e => console.error('❌ Fallback falhou:', e));
          }, 1000);
        });
      }, 200);
    }
    
    // Event listeners para debugging
    video.addEventListener('loadstart', () => console.log('🔄 Carregando vídeo...'));
    video.addEventListener('canplay', () => console.log('✅ Vídeo pronto para reproduzir'));
    video.addEventListener('playing', () => console.log('🎬 Vídeo reproduzindo'));
    video.addEventListener('ended', () => {
      console.log('🏁 Vídeo terminou');
      // Flutter será notificado via timer no Dart
    });
    video.addEventListener('error', (e) => console.error('❌ Erro no vídeo:', e));
    
    // Tenta carregar metadados imediatamente
    video.load();
    
    // Previne zoom e scroll
    document.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gesturestart', function(e) {
      e.preventDefault();
    });
  </script>
</body>
</html>
    ''';
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Stack(
        children: [
          // WebView com vídeo
          WebViewWidget(controller: _controller),
          
          // Loading overlay
          if (_isLoading)
            Container(
              color: Colors.black,
              child: const Center(
                child: CircularProgressIndicator(
                  color: Colors.white24,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
