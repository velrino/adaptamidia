import 'package:flutter/material.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import '../services/uvc_camera_service.dart';

class UvcCameraHost extends StatefulWidget {
  final Widget child;
  const UvcCameraHost({super.key, required this.child});

  @override
  State<UvcCameraHost> createState() => _UvcCameraHostState();
}

class _UvcCameraHostState extends State<UvcCameraHost> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      UvcCameraService.instance.ensureOpen();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        // Hidden preview to keep GL/context alive
        IgnorePointer(
          child: Align(
            alignment: Alignment.bottomRight,
            child: Opacity(
              opacity: 0, //CAMERA
              child: SizedBox(
                width: 640,
                height: 480,
                child: UVCCameraView(
                  cameraController: UvcCameraService.instance.controller,
                  width: 640,
                  height: 480,
                  autoDispose: false,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
