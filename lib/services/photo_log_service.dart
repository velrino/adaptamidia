import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'display_log_service.dart';

class PhotoLogService {
  PhotoLogService._internal();
  static final PhotoLogService instance = PhotoLogService._internal();

  // Timer? _retryTimer;

  Future<void> _ensureAuth() async {
    final auth = FirebaseAuth.instance;
    if (auth.currentUser == null) {
      try {
        final cred = await auth.signInAnonymously();
        debugPrint(
          '[PhotoLogService] Signed in anonymously uid=${cred.user?.uid}',
        );
      } catch (e) {
        debugPrint('[PhotoLogService] Anonymous sign-in failed: $e');
      }
    }
  }

  Future<Directory> _ensureDir(String name) async {
    final dir = await getApplicationDocumentsDirectory();
    final target = Directory(p.join(dir.path, name));
    if (!await target.exists()) {
      await target.create(recursive: true);
    }
    return target;
  }

  // Future<File> _persistPhoto(File src, String captureId) async {
  //   final photosDir = await _ensureDir('captured_photos');
  //   final dst = File(
  //     p.join(photosDir.path, '$captureId${p.extension(src.path, 3)}'),
  //   );
  //   try {
  //     return await src.copy(dst.path);
  //   } catch (_) {
  //     // fallback: move
  //     try {
  //       return await src.rename(dst.path);
  //     } catch (e) {
  //       debugPrint('[PhotoLogService] Failed to persist photo: $e');
  //       return src;
  //     }
  //   }
  // }

  Future<File> _pendingMetaFile(String captureId) async {
    final pendingDir = await _ensureDir('pending_logs');
    return File(p.join(pendingDir.path, '$captureId.json'));
  }

  // Future<void> _savePending(
  //   String captureId,
  //   String localPath,
  //   Map<String, dynamic> body,
  // ) async {
  //   final file = await _pendingMetaFile(captureId);
  //   final data = {'captureId': captureId, 'localPath': localPath, 'body': body};
  //   await file.writeAsString(json.encode(data), flush: true);
  //   debugPrint('[PhotoLogService] Queued pending log: $captureId');
  // }

  // Future<void> uploadAndLog(
  //   String captureId,
  //   File imageFile,
  //   Map<String, dynamic> body,
  // ) async {
  //   try {
  //     await _ensureAuth();
  //     // persist photo locally under app dir to avoid temp cleanup
  //     final persisted = await _persistPhoto(imageFile, captureId);

  //     // Choose correct Storage bucket (fix misconfigured google-services.json)
  //     final app = Firebase.app();
  //     String? bucket = app.options.storageBucket;
  //     if (bucket == null || bucket.endsWith('firebasestorage.app')) {
  //       final projectId = app.options.projectId;
  //       if (projectId != null) bucket = '$projectId.appspot.com';
  //     }
  //     final storage = bucket != null
  //         ? FirebaseStorage.instanceFor(bucket: bucket)
  //         : FirebaseStorage.instance;
  //     final uid = FirebaseAuth.instance.currentUser?.uid;

  //     final ref = storage
  //         .ref()
  //         .child('DISPLAY_PHOTOS')
  //         .child('$captureId${p.extension(persisted.path, 3)}');
  //     debugPrint(
  //       '[PhotoLogService] Uploading photo for $captureId to ${ref.fullPath} (bucket=${bucket ?? 'default'}) uid=${uid ?? 'null'}',
  //     );
  //     await ref.putFile(persisted, SettableMetadata(contentType: 'image/jpeg'));
  //     final url = await ref.getDownloadURL();
  //     debugPrint('[PhotoLogService] Upload success for $captureId, url=$url');

  //     final enriched = Map<String, dynamic>.from(body);
  //     enriched['photo_url'] = url;

  //     await DisplayLogService.instance.createLog(
  //       identifier: captureId,
  //       body: enriched,
  //     );
  //   } catch (e, st) {
  //     debugPrint('[PhotoLogService] Upload failed for $captureId: $e');
  //     debugPrint('[PhotoLogService] Stack: $st');
  //     // queue for later (upload + log together)
  //     // ensure we point to the persisted path so the image remains available
  //     try {
  //       final persisted = await _persistPhoto(imageFile, captureId);
  //       await _savePending(captureId, persisted.path, body);
  //     } catch (_) {
  //       await _savePending(captureId, imageFile.path, body);
  //     }
  //     _ensureRetryLoop();
  //   }
  // }

  // void _ensureRetryLoop() {
  //   _retryTimer ??= Timer.periodic(const Duration(minutes: 2), (_) {
  //     unawaited(processQueue());
  //   });
  // }

  Future<void> processQueue() async {
    try {
      await _ensureAuth();
      final pendingDir = await _ensureDir('pending_logs');
      final entries = pendingDir.listSync().whereType<File>().where(
        (f) => f.path.endsWith('.json'),
      );
      for (final file in entries) {
        try {
          final raw = await file.readAsString();
          final data = json.decode(raw) as Map<String, dynamic>;
          final captureId = data['captureId'] as String;
          final localPath = data['localPath'] as String;
          final body = Map<String, dynamic>.from(data['body'] as Map);

          final imageFile = File(localPath);
          if (!await imageFile.exists()) {
            debugPrint(
              '[PhotoLogService] Missing image for pending $captureId, sending log without photo',
            );
            await DisplayLogService.instance.createLog(
              identifier: captureId,
              body: body,
            );
            await file.delete();
            continue;
          }

          // Retry upload
          final ref = FirebaseStorage.instance
              .ref()
              .child('DISPLAY_PHOTOS')
              .child('$captureId${p.extension(imageFile.path, 3)}');
          debugPrint('[PhotoLogService] Retrying upload for $captureId');
          await ref.putFile(
            imageFile,
            SettableMetadata(contentType: 'image/jpeg'),
          );
          final url = await ref.getDownloadURL();

          final enriched = Map<String, dynamic>.from(body);
          enriched['photo_url'] = url;
          await DisplayLogService.instance.createLog(
            identifier: captureId,
            body: enriched,
          );

          await file.delete();
        } catch (e, st) {
          debugPrint('[PhotoLogService] Retry failed: $e');
          debugPrint('[PhotoLogService] Stack: $st');
        }
      }
    } catch (e) {
      debugPrint('[PhotoLogService] processQueue error: $e');
    }
  }
}
