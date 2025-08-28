import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;

// UVC preview (ajuste os imports conforme o seu plugin)
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';

// YOLO headless (ultralytics_yolo)
import 'package:ultralytics_yolo/ultralytics_yolo.dart';

// ======= MODELO DE DADOS P/ PINTURA =======
class YoloBox {
  final Rect rect; // coordenadas em pixels na tela
  final String label; // ex.: "person 0.87"
  final double confidence; // 0..1
  YoloBox({required this.rect, required this.label, required this.confidence});
}

// ======= P A I N T E R  =======
class _BboxPainter extends CustomPainter {
  final List<YoloBox> boxes;

  _BboxPainter(this.boxes);

  @override
  void paint(Canvas canvas, Size size) {
    final border = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..color = Colors.greenAccent;

    final bg = Paint()
      ..style = PaintingStyle.fill
      ..color = Colors.black.withValues(alpha: 0.45);

    for (final b in boxes) {
      canvas.drawRect(b.rect, border);

      // Rotulo
      final tp = TextPainter(
        text: TextSpan(
          text: b.label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            height: 1.2,
            fontWeight: FontWeight.w600,
          ),
        ),
        textDirection: TextDirection.ltr,
        maxLines: 1,
        ellipsis: '…',
      )..layout(maxWidth: 200);

      final labelRect = Rect.fromLTWH(
        b.rect.left,
        (b.rect.top - tp.height - 6).clamp(0.0, double.infinity),
        tp.width + 10,
        tp.height + 6,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(labelRect, const Radius.circular(6)),
        bg,
      );
      tp.paint(canvas, Offset(labelRect.left + 5, labelRect.top + 3));
    }
  }

  @override
  bool shouldRepaint(covariant _BboxPainter oldDelegate) {
    return oldDelegate.boxes != boxes;
  }
}

// ======= T E L A  P R I N C I P A L =======
class YoloUvcBboxScreen extends StatefulWidget {
  const YoloUvcBboxScreen({super.key});

  @override
  State<YoloUvcBboxScreen> createState() => _YoloUvcBboxScreenState();
}

class _YoloUvcBboxScreenState extends State<YoloUvcBboxScreen> {
  // UVC
  late UVCCameraController _uvcController;
  bool _isCameraOpen = false;
  bool _isStreaming = false; // Inicialmente false
  bool _isWidgetRendered = false;
  bool _showCameraView = false; // Controla quando mostrar a view

  // YOLO
  YOLO? _detector;
  bool _modelReady = false;
  bool _inferenceBusy = false;

  // Overlay
  final ValueNotifier<List<YoloBox>> _boxes = ValueNotifier<List<YoloBox>>([]);

  // Throttle para não inferir em TODO frame
  final Duration _minInferenceInterval = const Duration(milliseconds: 140);
  DateTime _lastInference = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    _initUvc();
    _initYolo();

    // Iniciar câmera e stream automaticamente
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 2000), () async {
        if (mounted) {
          await _openCamera();
          // Aguardar um pouco e iniciar o stream
          await Future.delayed(const Duration(milliseconds: 1000));
          if (mounted && _isCameraOpen) {
            debugPrint("🎬 Iniciando stream de captura...");
            _startStream();
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _uvcController.dispose();
    _boxes.dispose();
    super.dispose();
  }

  // ============= UVC =============
  Future<void> _initUvc() async {
    try {
      // Inicializar o controlador UVC
      _uvcController = UVCCameraController();

      // Configurar callbacks
      _uvcController.msgCallback = (state) {
        debugPrint("Camera message: $state");
      };

      _uvcController.cameraStateCallback = (state) {
        debugPrint("Camera state changed: $state");
        if (mounted) {
          setState(() {
            _isCameraOpen = state == UVCCameraState.opened;
          });
        }
      };

      _uvcController.onVideoFrameCallback = (frame) {
        // Log sempre para ver se está recebendo frames
        final now = DateTime.now();
        final timeSinceLastLog = now.difference(_lastInference).inMilliseconds;
        
        // Log a cada segundo
        if (timeSinceLastLog > 1000) {
          debugPrint("📹 Frame: size=${frame.size}, fps=${frame.fps}, YOLO ready=$_modelReady");
          _lastInference = now;
        }

        // Processar frame para YOLO
        if (!_modelReady) {
          debugPrint("⚠️ YOLO não está pronto ainda");
          return;
        }
        if (_inferenceBusy) {
          return;
        }
        if (timeSinceLastLog < 140) {
          return;
        }

        debugPrint("🔍 Processando frame para YOLO...");
        _processFrameForYolo(frame);
      };

      _uvcController.onStreamStateCallback = (stateEvent) {
        debugPrint("Stream state changed: ${stateEvent.state}");
        if (mounted) {
          setState(() {
            if (stateEvent.state == 'STARTED' ||
                stateEvent.state == 'STREAM_STARTED') {
              _isStreaming = true;
            } else if (stateEvent.state == 'STOPPED' ||
                stateEvent.state == 'STREAM_STOPPED') {
              _isStreaming = false;
            }
          });
        }
      };

      // NÃO abrir a câmera aqui - será feito quando o widget for renderizado
    } catch (e) {
      debugPrint('Erro ao inicializar UVC: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao inicializar câmera UVC: $e')),
        );
      }
    }
  }

  void _processFrameForYolo(dynamic frame) {
    try {
      if (_detector == null || !_modelReady) {
        debugPrint('YOLO não está pronto ainda');
        return;
      }

      debugPrint('Processando frame para YOLO: ${frame.size}');

      // Converter frame para bytes (implementação depende da API da biblioteca)
      // Por enquanto, vamos tentar extrair dados do frame
      _extractFrameDataAndDetect(frame);
    } catch (e) {
      debugPrint('Erro ao processar frame: $e');
    }
  }

  Future<void> _extractFrameDataAndDetect(dynamic frame) async {
    try {
      if (_inferenceBusy) return;
      _inferenceBusy = true;

      // Tentar extrair dados do frame
      Uint8List? frameBytes;

      // Método 1: Se o frame tiver propriedade 'data' ou 'bytes'
      if (frame.data != null) {
        frameBytes = frame.data as Uint8List;
      } else if (frame.bytes != null) {
        frameBytes = frame.bytes as Uint8List;
      } else if (frame.imageData != null) {
        frameBytes = frame.imageData as Uint8List;
      }

      // Método 2: Se o frame tiver método para converter
      if (frameBytes == null && frame.toBytes != null) {
        frameBytes = await frame.toBytes();
      }

      // Método 3: Se o frame tiver método para obter JPEG
      if (frameBytes == null && frame.toJpeg != null) {
        frameBytes = await frame.toJpeg();
      }

      if (frameBytes != null) {
        debugPrint('Frame convertido para bytes: ${frameBytes.length} bytes');
        await _runYoloDetection(frameBytes);
      } else {
        debugPrint(
          'Não foi possível extrair bytes do frame. Propriedades disponíveis: ${frame.runtimeType}',
        );
        // Listar propriedades disponíveis para debug
        if (frame is Map) {
          for (final key in frame.keys) {
            debugPrint('Frame key: $key = ${frame[key]}');
          }
        }
      }
    } catch (e) {
      debugPrint('Erro ao extrair dados do frame: $e');
    } finally {
      _inferenceBusy = false;
    }
  }

  Future<void> _runYoloDetection(Uint8List frameBytes) async {
    try {
      // Debug: verificar assinatura do frame
      if (frameBytes.length > 10) {
        debugPrint(
          'Primeiros 10 bytes do frame: ${frameBytes.sublist(0, 10).map((b) => '0x${b.toRadixString(16).padLeft(2, '0')}')}',
        );
      }

      // Verificar se é realmente um JPEG válido (deve começar com 0xFFD8)
      if (frameBytes.length < 2 ||
          frameBytes[0] != 0xFF ||
          frameBytes[1] != 0xD8) {
        debugPrint(
          'Erro: Frame não parece ser JPEG válido. Primeiros bytes: ${frameBytes.take(4).toList()}',
        );

        // Tentar usar os bytes diretamente como RGB se não for JPEG
        // Assumindo 640x480 com 3 canais RGB
        if (frameBytes.length == 640 * 480 * 3) {
          debugPrint(
            'Frame parece ser RGB bruto (640x480x3). Usando diretamente...',
          );
          final results = await _detector!.predict(frameBytes);
          debugPrint('YOLO retornou ${results.length} resultados');
          _processResults(results);
          return;
        }

        // Outra possibilidade: YUV format
        debugPrint('Frame não identificado. Tamanho: ${frameBytes.length}');
        return;
      }

      debugPrint('Decodificando frame JPEG (${frameBytes.length} bytes)...');

      // Decodificar o frame JPEG para obter pixels brutos
      final image = img.decodeImage(frameBytes);
      if (image == null) {
        debugPrint(
          'Erro: img.decodeImage falhou. Frame pode estar corrompido.',
        );
        return;
      }

      debugPrint('Frame decodificado: ${image.width}x${image.height}');

      // Converter para formato RGB (YOLO precisa de dados brutos RGB)
      final rgbBytes = _imageToRgbBytes(image);

      debugPrint(
        'Executando detecção YOLO com ${rgbBytes.length} bytes RGB...',
      );

      final results = await _detector!.predict(rgbBytes);
      debugPrint('YOLO retornou ${results.length} resultados');
      _processResults(results);
    } catch (e) {
      debugPrint('Erro na detecção YOLO: $e');
    }
  }

  void _processResults(dynamic results) {
    try {
      final List<YoloBox> detectedBoxes = [];

      if (results is List) {
        for (int i = 0; i < results.length; i++) {
          _processDetectionResult(results[i], detectedBoxes);
        }
      } else if (results is Map) {
        // Se for um mapa, tentar extrair detecções
        final detections = results['detections'];
        if (detections is List) {
          for (int i = 0; i < detections.length; i++) {
            _processDetectionResult(detections[i], detectedBoxes);
          }
        }
      }

      _boxes.value = detectedBoxes;
      debugPrint('Atualizadas ${detectedBoxes.length} bounding boxes');
    } catch (e) {
      debugPrint('Erro ao processar resultados YOLO: $e');
    }
  }

  void _processDetectionResult(dynamic result, List<YoloBox> detectedBoxes) {
    try {
      // Tentar extrair informações da detecção
      final className = result['className'] ?? result['class'] ?? '';
      final confidence = (result['confidence'] ?? 0.0).toDouble();

      // Filtrar apenas pessoas com confiança alta
      if (className.toString().toLowerCase().contains('person') &&
          confidence > 0.5) {
        // Coordenadas normalizadas (0..1) -> pixels da tela
        final x = (result['x'] ?? 0.0).toDouble();
        final y = (result['y'] ?? 0.0).toDouble();
        final width = (result['width'] ?? 0.0).toDouble();
        final height = (result['height'] ?? 0.0).toDouble();

        final rect = Rect.fromLTWH(
          x * MediaQuery.of(context).size.width,
          y * MediaQuery.of(context).size.height,
          width * MediaQuery.of(context).size.width,
          height * MediaQuery.of(context).size.height,
        );

        detectedBoxes.add(
          YoloBox(
            rect: rect,
            label: 'person ${confidence.toStringAsFixed(2)}',
            confidence: confidence,
          ),
        );

        debugPrint(
          'Pessoa detectada: conf=${confidence.toStringAsFixed(2)}, rect=$rect',
        );
      }
    } catch (e) {
      debugPrint('Erro ao processar resultado: $e');
    }
  }

  // ============= YOLO =============
  Future<void> _initYolo() async {
    try {
      debugPrint("🚀 Iniciando carregamento do modelo YOLO...");
      
      final detector = YOLO(
        modelPath: 'assets/models/yolo11n.tflite',
        task: YOLOTask.detect,
        useGpu: true, // se o dispositivo suportar
        useMultiInstance: true,
      );
      
      debugPrint("📦 Carregando modelo yolo11n.tflite...");
      await detector.loadModel();
      
      setState(() {
        _detector = detector;
        _modelReady = true;
      });
      debugPrint('✅ YOLO carregado com sucesso! Modelo está pronto para detecção.');
    } catch (e) {
      debugPrint('❌ Falha ao carregar YOLO: $e');
      debugPrint('Stack trace: ${StackTrace.current}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao carregar modelo YOLO: $e')),
        );
      }
    }
  }

  // Métodos para controlar a câmera
  Future<void> _openCamera() async {
    try {
      // Primeiro, mostrar a view da câmera
      if (!_showCameraView) {
        setState(() {
          _showCameraView = true;
        });
        // Aguardar a view ser renderizada
        await Future.delayed(const Duration(milliseconds: 1000));
      }

      debugPrint('Tentando abrir câmera UVC...');
      await _uvcController.openUVCCamera();
    } catch (e) {
      debugPrint('Erro ao abrir câmera: $e');
      if (mounted) {
        setState(() {
          _showCameraView = false;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro ao abrir câmera: $e')));
      }
    }
  }

  Future<void> _startStream() async {
    try {
      debugPrint("▶️ Chamando captureStreamStart()...");
      _uvcController.captureStreamStart();
      debugPrint("✅ Stream de captura iniciado!");
      setState(() {
        _isStreaming = true;
      });
    } catch (e) {
      debugPrint('❌ Erro ao iniciar stream: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro ao iniciar stream: $e')));
      }
    }
  }

  Future<void> _stopStream() async {
    try {
      _uvcController.captureStreamStop();
    } catch (e) {
      debugPrint('Erro ao parar stream: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro ao parar stream: $e')));
      }
    }
  }

  // Converter imagem decodificada para bytes RGB
  Uint8List _imageToRgbBytes(img.Image image) {
    // YOLO espera dados RGB em formato plano (não entrelaçado)
    // Formato: [R,G,B,R,G,B,R,G,B,...]
    final bytes = Uint8List(image.width * image.height * 3);
    int idx = 0;

    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        bytes[idx++] = pixel.r.toInt(); // Red
        bytes[idx++] = pixel.g.toInt(); // Green
        bytes[idx++] = pixel.b.toInt(); // Blue
      }
    }

    return bytes;
  }

  // ============= UI =============
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: LayoutBuilder(
        builder: (context, constraints) {
          // Marcar que o widget foi renderizado
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!_isWidgetRendered) {
              setState(() {
                _isWidgetRendered = true;
              });
            }
          });

          return Stack(
            fit: StackFit.expand,
            children: [
              // Preview da UVC - sempre visível
              if (_showCameraView)
                UVCCameraView(
                  cameraController: _uvcController,
                  params: const UVCCameraViewParamsEntity(frameFormat: 1),
                  width: constraints.maxWidth.toDouble(),
                  height: constraints.maxHeight.toDouble(),
                )
              else
                const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                ),

              // Overlay de BBOX
              ValueListenableBuilder<List<YoloBox>>(
                valueListenable: _boxes,
                builder: (context, boxes, _) {
                  return CustomPaint(
                    size: Size.infinite,
                    painter: _BboxPainter(boxes),
                  );
                },
              ),

              // Status do YOLO
              Positioned(
                left: 12,
                bottom: 12,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    child: Text(
                      _modelReady
                          ? 'YOLO: ${_boxes.value.length} detecções'
                          : 'Carregando YOLO...',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
              ),

              // Status da câmera
              Positioned(
                right: 12,
                bottom: 12,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: _isStreaming
                        ? Colors.green.withOpacity(0.7)
                        : Colors.black54,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _isStreaming ? Icons.videocam : Icons.videocam_off,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _isStreaming ? 'Streaming' : 'Conectando...',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
