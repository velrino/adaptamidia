import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';

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

  void _clearCapturedImage() {
    setState(() {
      _capturedImage = null;
      _statusMsg = 'Imagem descartada';
    });
  }

  @override
  void dispose() {
    _controller.closeCamera();
    _controller.dispose();
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
                      ? Stack(
                          children: [
                            Center(
                              child: Image.memory(
                                _capturedImage!,
                                fit: BoxFit.contain,
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
                          ],
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
