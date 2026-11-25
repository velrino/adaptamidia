import 'dart:io';
import 'dart:async';

/// Servidor HTTP local para servir arquivos de vídeo
class LocalVideoServer {
  static final LocalVideoServer _instance = LocalVideoServer._internal();
  static LocalVideoServer get instance => _instance;
  LocalVideoServer._internal();

  HttpServer? _server;
  int _port = 8080;
  
  /// Inicia servidor local
  Future<void> start() async {
    if (_server != null) return; // Já rodando
    
    try {
      _server = await HttpServer.bind(InternetAddress.loopbackIPv4, _port);
      print('🌐 Servidor local iniciado em http://127.0.0.1:$_port');
      
      _server!.listen(_handleRequest);
    } catch (e) {
      print('❌ Erro ao iniciar servidor: $e');
    }
  }
  
  /// Para servidor
  Future<void> stop() async {
    if (_server != null) {
      await _server!.close();
      _server = null;
      print('🛑 Servidor local parado');
    }
  }
  
  /// Converte caminho de arquivo local para URL do servidor
  String getLocalUrl(String filePath) {
    final fileName = filePath.split('/').last;
    return 'http://127.0.0.1:$_port/video/$fileName?path=${Uri.encodeComponent(filePath)}';
  }
  
  /// Manipula requisições HTTP
  void _handleRequest(HttpRequest request) {
    final uri = request.uri;
    
    if (uri.path.startsWith('/video/')) {
      _serveVideoFile(request);
    } else {
      request.response
        ..statusCode = HttpStatus.notFound
        ..write('Not Found')
        ..close();
    }
  }
  
  /// Serve arquivo de vídeo
  void _serveVideoFile(HttpRequest request) async {
    try {
      final filePath = request.uri.queryParameters['path'];
      if (filePath == null) {
        request.response
          ..statusCode = HttpStatus.badRequest
          ..write('Missing path parameter')
          ..close();
        return;
      }
      
      final file = File(filePath);
      if (!await file.exists()) {
        request.response
          ..statusCode = HttpStatus.notFound
          ..write('File not found: $filePath')
          ..close();
        return;
      }
      
      final fileBytes = await file.readAsBytes();
      
      request.response
        ..statusCode = HttpStatus.ok
        ..headers.contentType = ContentType('video', 'mp4')
        ..headers.add('Accept-Ranges', 'bytes')
        ..headers.contentLength = fileBytes.length
        ..add(fileBytes)
        ..close();
        
      print('📹 Servindo vídeo: ${file.path} (${fileBytes.length} bytes)');
      
    } catch (e) {
      print('❌ Erro ao servir vídeo: $e');
      request.response
        ..statusCode = HttpStatus.internalServerError
        ..write('Internal Server Error')
        ..close();
    }
  }
}