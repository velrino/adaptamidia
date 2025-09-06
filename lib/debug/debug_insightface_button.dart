import 'dart:convert';

import 'package:flutter/material.dart';

import '../services/insightface_service.dart';

/// Small, self-contained debug action to trigger InsightFace capture + analyze.
/// Drop-in and easy to remove. Only shown in debug/profile by caller.
class DebugInsightFaceButton extends StatefulWidget {
  const DebugInsightFaceButton({super.key});

  @override
  State<DebugInsightFaceButton> createState() => _DebugInsightFaceButtonState();
}

class _DebugInsightFaceButtonState extends State<DebugInsightFaceButton> {
  bool _busy = false;

  Future<void> _run(BuildContext context) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await InsightFaceService.instance.ensureInitialized();
      final res = await InsightFaceService.instance.captureAndAnalyze();
      if (!context.mounted) return;
      showModalBottomSheet(
        context: context,
        showDragHandle: true,
        isScrollControlled: true,
        builder: (_) => Padding(
          padding: const EdgeInsets.all(16),
          child: SingleChildScrollView(
            child: Text(
              const JsonEncoder.withIndent('  ').convert(res),
              style: const TextStyle(fontFamily: 'monospace', fontSize: 14),
            ),
          ),
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('InsightFace error: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'InsightFace (debug)',
      onPressed: _busy ? null : () => _run(context),
      icon: _busy
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.face_6),
    );
  }
}
