import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'package:ultralytics_yolo/ultralytics_yolo.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';

/// SeeMidia Camera Screen - Displays USB webcam content on screen
/// This screen shows the live feed from a USB webcam connected to the tablet
class CameraScreen extends StatefulWidget {
  final String? unitId;
  const CameraScreen({super.key, this.unitId});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen>
    with WidgetsBindingObserver {
  final UVCCameraController _controller = UVCCameraController();

  bool _isOpened = false;
  bool _opening = false;
  String? _statusMsg;
  Uint8List? _capturedImage; // Armazena a imagem capturada temporariamente
  bool _isCapturing = false; // Controla se está no processo de captura

  // YOLO detection
  YOLO? _yolo;
  List<YOLOResult>? _detections;
  bool _isProcessingYOLO = false;
  Size? _imageSize;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // React to camera state changes
    _controller.cameraStateCallback = (UVCCameraState state) {
      setState(() {
        _isOpened = state == UVCCameraState.opened;
        _statusMsg = 'Camera state: $state';
        _opening = false;
      });
    };

    // Optional: log messages from native side
    _controller.msgCallback = (String msg) {
      setState(() => _statusMsg = msg);
    };

    // Initialize YOLO model
    _initializeYOLO();

    // Auto-open when page appears
    _openCamera();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.detached) {
      _controller.closeCamera();
      // Limpa a imagem capturada ao sair da tela
      if (_capturedImage != null) {
        setState(() {
          _capturedImage = null;
        });
      }
    } else if (state == AppLifecycleState.resumed) {
      // Try to reopen if returning to the screen
      if (!_isOpened && !_opening) {
        _openCamera();
      }
    }
  }

  Future<void> _initializeYOLO() async {
    try {
      setState(() => _statusMsg = 'Iniciando modelo YOLO...');

      // Copy model from assets to temporary directory
      final ByteData data = await rootBundle.load(
        'assets/models/yolo11n.tflite',
      );
      final List<int> bytes = data.buffer.asUint8List();
      final tempDir = await getTemporaryDirectory();
      final modelFile = File('${tempDir.path}/yolo11n.tflite');
      await modelFile.writeAsBytes(bytes);

      // Use file path instead of asset path
      _yolo = YOLO(
        modelPath: modelFile.path, // Use the physical file path
        task: YOLOTask.detect,
        useGpu: false,
      );

      await _yolo!.loadModel();

      setState(() => _statusMsg = 'Modelo YOLO carregado');
      debugPrint(
        '[CameraScreen] YOLO model loaded successfully from: ${modelFile.path}',
      );
    } catch (e) {
      setState(() => _statusMsg = 'Erro ao carregar YOLO: $e');
      debugPrint('[CameraScreen] YOLO initialization error: $e');
    }
  }

  Future<void> _openCamera() async {
    if (_opening || _isOpened) return;
    setState(() {
      _opening = true;
      _statusMsg = 'Opening UVC camera...';
    });

    try {
      // Initialize (optional depending on plugin version, harmless if redundant)
      await _controller.initializeCamera();

      await _controller.openUVCCamera();
      setState(() {
        _statusMsg = 'UVC camera opened.';
      });
    } catch (e) {
      setState(() {
        _opening = false;
        _statusMsg = 'Failed to open camera: $e';
      });
      debugPrint('[CameraScreen] open error: $e');
    }
  }

  Future<void> _takePicture() async {
    if (!_isOpened || _isCapturing) return;

    setState(() {
      _isCapturing = true;
      _statusMsg = 'Capturando imagem...';
    });

    try {
      // Captura a foto (retorna caminho do arquivo)
      final imagePath = await _controller.takePicture();

      debugPrint('[CameraScreen] temp file: $imagePath');

      if (imagePath != null) {
        // Lê o arquivo e converte para Uint8List
        final imageFile = File(imagePath);
        final imageBytes = await imageFile.readAsBytes();

        setState(() {
          _capturedImage = imageBytes;
          _statusMsg = 'Imagem capturada com sucesso!';
          _isCapturing = false;
        });

        // Remove o arquivo temporário após carregar em memória
        try {
          await imageFile.delete();
        } catch (e) {
          debugPrint('[CameraScreen] Failed to delete temp file: $e');
        } finally {
          debugPrint('[CameraScreen] Delete temp file: $imagePath');
        }

        // Executar detecção YOLO na imagem capturada
        _runYOLODetection(imageBytes);
      } else {
        setState(() {
          _statusMsg = 'Falha ao capturar imagem: caminho nulo';
          _isCapturing = false;
        });
      }
    } catch (e) {
      setState(() {
        _statusMsg = 'Falha ao capturar imagem: $e';
        _isCapturing = false;
      });
      debugPrint('[CameraScreen] capture error: $e');
    }
  }

  Future<void> _runYOLODetection(Uint8List imageBytes) async {
    if (_yolo == null || _isProcessingYOLO) return;

    setState(() {
      _isProcessingYOLO = true;
      _statusMsg = 'Processando detecção YOLO...';
    });

    try {
      // Obter tamanho da imagem para os cálculos de bounding box
      final decoded = img.decodeImage(imageBytes);
      if (decoded != null) {
        _imageSize = Size(decoded.width.toDouble(), decoded.height.toDouble());
      }

      // Executar predição YOLO
      final result = await _yolo!.predict(
        imageBytes,
        confidenceThreshold: 0.5,
        iouThreshold: 0.4,
      );

      // Converter detecções para YOLOResult objects
      final detectionsList = result['detections'] as List<dynamic>?;
      if (detectionsList != null) {
        final yoloDetections = detectionsList
            .map((detection) => YOLOResult.fromMap(detection))
            .toList();

        setState(() {
          _detections = yoloDetections;
          _statusMsg = 'Detectados ${yoloDetections.length} objetos';
          _isProcessingYOLO = false;
        });

        debugPrint(
          '[CameraScreen] YOLO detected ${yoloDetections.length} objects',
        );
        for (final detection in yoloDetections) {
          debugPrint(
            '[CameraScreen] - ${detection.className}: ${detection.confidence.toStringAsFixed(2)}',
          );
        }
      } else {
        setState(() {
          _detections = [];
          _statusMsg = 'Nenhum objeto detectado';
          _isProcessingYOLO = false;
        });
      }
    } catch (e) {
      setState(() {
        _statusMsg = 'Erro na detecção YOLO: $e';
        _isProcessingYOLO = false;
        _detections = null;
      });
      debugPrint('[CameraScreen] YOLO detection error: $e');
    }
  }

  void _clearCapturedImage() {
    setState(() {
      _capturedImage = null;
      _detections = null;
      _imageSize = null;
      _statusMsg = 'Imagem descartada';
    });
  }

  // Widget para desenhar bounding boxes YOLO
  Widget _buildBoundingBoxOverlay(Size displaySize) {
    if (_detections == null || _detections!.isEmpty || _imageSize == null) {
      return const SizedBox.shrink();
    }

    return CustomPaint(
      size: displaySize,
      painter: BoundingBoxPainter(
        detections: _detections!,
        imageSize: _imageSize!,
        displaySize: displaySize,
      ),
    );
  }

  @override
  void dispose() {
    _controller.closeCamera();
    _controller.dispose();

    // Dispose YOLO resources
    _yolo?.dispose();

    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          title: const Text('SeeMidia Camera'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Reabrir câmera',
              onPressed: _openCamera,
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              // Área da webcam ao vivo
              Expanded(
                flex: 2,
                child: Container(
                  color: Colors.black,
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final width = constraints.maxWidth;
                          final height = constraints.maxHeight;
                          return ClipRect(
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Colors.black,
                              ),
                              child: UVCCameraView(
                                cameraController: _controller,
                                width: width,
                                height: height,
                                autoDispose: false,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),

              // Divisor
              Container(height: 2, color: Colors.grey[800]),

              // Área da imagem capturada
              Expanded(
                flex: 1,
                child: Container(
                  color: Colors.black,
                  padding: const EdgeInsets.all(8.0),
                  child: _capturedImage != null
                      ? LayoutBuilder(
                          builder: (context, constraints) {
                            final displaySize = Size(
                              constraints.maxWidth,
                              constraints.maxHeight,
                            );
                            return Stack(
                              children: [
                                Center(
                                  child: Image.memory(
                                    _capturedImage!,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                                // YOLO Bounding boxes overlay
                                if (_detections != null &&
                                    _detections!.isNotEmpty)
                                  Center(
                                    child: _buildBoundingBoxOverlay(
                                      displaySize,
                                    ),
                                  ),
                                // Processing indicator
                                if (_isProcessingYOLO)
                                  const Center(
                                    child: CircularProgressIndicator(
                                      color: Colors.orange,
                                    ),
                                  ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: IconButton(
                                    icon: const Icon(
                                      Icons.close,
                                      color: Colors.white,
                                    ),
                                    onPressed: _clearCapturedImage,
                                    tooltip: 'Descartar imagem',
                                  ),
                                ),
                                // Detection count info
                                if (_detections != null &&
                                    _detections!.isNotEmpty)
                                  Positioned(
                                    top: 8,
                                    left: 8,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(
                                          alpha: 0.7,
                                        ),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '${_detections!.length} objetos detectados',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            );
                          },
                        )
                      : Center(
                          child: Text(
                            'Nenhuma imagem capturada',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 16,
                            ),
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
        floatingActionButton: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            // Botão de foco
            FloatingActionButton.small(
              heroTag: 'focus',
              onPressed: _isOpened ? _toggleAutofocus : null,
              tooltip: 'Alternar foco automático',
              child: const Icon(Icons.center_focus_strong),
            ),
            const SizedBox(height: 16),
            // Botão de captura
            FloatingActionButton(
              heroTag: 'capture',
              onPressed: _isOpened && !_isCapturing ? _takePicture : null,
              tooltip: 'Capturar imagem',
              child: _isCapturing
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Icon(Icons.camera_alt),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleAutofocus() async {
    try {
      await _controller.setAutoFocus(true);
      setState(() => _statusMsg = 'Autofoco ativado');
    } catch (e) {
      setState(() => _statusMsg = 'Falha ao alternar autofoco: $e');
    }
  }
}

/// Custom painter para desenhar bounding boxes das detecções YOLO
class BoundingBoxPainter extends CustomPainter {
  final List<YOLOResult> detections;
  final Size imageSize;
  final Size displaySize;

  BoundingBoxPainter({
    required this.detections,
    required this.imageSize,
    required this.displaySize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;

    final textStyle = TextStyle(
      color: Colors.white,
      fontSize: 14,
      fontWeight: FontWeight.bold,
      shadows: [
        Shadow(
          offset: const Offset(1, 1),
          blurRadius: 2,
          color: Colors.black.withValues(alpha: 0.8),
        ),
      ],
    );

    // Calcular fator de escala para converter coordenadas da imagem para coordenadas de display
    final scaleX = displaySize.width / imageSize.width;
    final scaleY = displaySize.height / imageSize.height;

    for (final detection in detections) {
      // Converter coordenadas para o espaço de display
      final box = detection.boundingBox;
      final displayBox = Rect.fromLTRB(
        box.left * scaleX,
        box.top * scaleY,
        box.right * scaleX,
        box.bottom * scaleY,
      );

      // Cores diferentes para diferentes classes (baseado no hash do nome)
      final colorIndex = detection.className.hashCode % _colors.length;
      paint.color = _colors[colorIndex];

      // Desenhar bounding box
      canvas.drawRect(displayBox, paint);

      // Desenhar label com confiança
      final label =
          '${detection.className} ${(detection.confidence * 100).toStringAsFixed(0)}%';
      final textPainter = TextPainter(
        text: TextSpan(text: label, style: textStyle),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();

      // Posicionar o label acima da bounding box, ou dentro se não couber
      final labelY = displayBox.top - textPainter.height - 4;
      final finalLabelY = labelY < 0 ? displayBox.top + 4 : labelY;

      // Desenhar fundo semi-transparente para o texto
      final labelBackground = Rect.fromLTWH(
        displayBox.left - 2,
        finalLabelY - 2,
        textPainter.width + 4,
        textPainter.height + 4,
      );

      canvas.drawRect(
        labelBackground,
        Paint()..color = _colors[colorIndex].withValues(alpha: 0.8),
      );

      // Desenhar o texto
      textPainter.paint(canvas, Offset(displayBox.left, finalLabelY));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;

  // Cores para diferentes classes
  static const List<Color> _colors = [
    Colors.red,
    Colors.green,
    Colors.blue,
    Colors.yellow,
    Colors.purple,
    Colors.orange,
    Colors.cyan,
    Colors.pink,
    Colors.lime,
    Colors.indigo,
  ];
}
