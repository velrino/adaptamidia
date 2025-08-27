import 'dart:async';
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Lock to landscape if you prefer:
    // SystemChrome.setPreferredOrientations([DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight]);

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

      // If you want to pick a specific preview size:
      // final sizes = await _controller.getAllPreviewSizes();
      // sizes.sort((a, b) => (b.width * b.height).compareTo(a.width * a.height));
      // if (sizes.isNotEmpty) {
      //   await _controller.updateResolution(sizes.first); // pick highest res
      // }

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

  @override
  void dispose() {
    _controller.closeCamera();
    _controller.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
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
        child: Stack(
          children: [
            // Fullscreen preview keeping aspect ratio by covering the screen
            // (similar to BoxFit.cover).
            Positioned.fill(
              child: Center(
                child: AspectRatio(
                  // Fallback aspect ratio; the widget will adapt as frames arrive.
                  aspectRatio: 16 / 9,
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final width = constraints.maxWidth;
                      final height = constraints.maxHeight;
                      return UVCCameraView(
                        cameraController: _controller,
                        width: width,
                        height: height,
                        // You can tweak params if needed, e.g. bitrate, fps limits, etc.
                        // params: UVCCameraParams(...),
                        autoDispose: false, // we manage lifecycle ourselves
                      );
                    },
                  ),
                ),
              ),
            ),

            // Status Overlay
            if (_statusMsg != null)
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: AnimatedOpacity(
                  opacity: 0.9,
                  duration: const Duration(milliseconds: 250),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.videocam,
                              color: _isOpened ? Colors.green : Colors.red,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'USB Camera: ${_isOpened ? "Conectada" : "Desconectada"}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _statusMsg!,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
      floatingActionButton: _buildControls(),
    );
  }

  Widget _buildControls() {
    return FloatingActionButton.small(
      heroTag: 'focus',
      onPressed: _isOpened ? _toggleAutofocus : null,
      tooltip: 'Alternar foco automático',
      child: const Icon(Icons.center_focus_strong),
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
