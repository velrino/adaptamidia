import 'dart:async';
import 'package:flutter/material.dart';

// UVC preview (ajuste os imports conforme o seu plugin)
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';

// ======= T E L A  P R I N C I P A L =======
class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  // UVC
  late UVCCameraController _uvcController;
  bool _isCameraOpen = false;
  bool _isStreaming = false;
  bool _showCameraView = false;

  @override
  void initState() {
    super.initState();
    _initUvc();

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
    } catch (e) {
      debugPrint('Erro ao inicializar UVC: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao inicializar câmera UVC: $e')),
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

  // ============= UI =============
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: LayoutBuilder(
        builder: (context, constraints) {
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

              // Status da câmera
              Positioned(
                right: 12,
                bottom: 12,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: _isStreaming
                        ? Colors.green.withValues(alpha: 0.7)
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
