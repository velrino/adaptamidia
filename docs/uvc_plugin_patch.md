Goal: Capture image bytes without saving into DCIM/MediaStore to avoid MediaScanner and gallery pollution.

Approach A — New plugin API (recommended)

Android (Kotlin) in flutter_uvc_camera plugin:

1) Add a method channel handler, e.g. 'captureToBytes'.

2) Inside, grab a frame from the active ImageReader and encode to JPEG in-memory.

   Example sketch:

   ```kotlin
   imageReader.acquireLatestImage()?.use { image ->
       val buffer = image.planes[0].buffer
       val bytes = ByteArray(buffer.remaining())
       buffer.get(bytes)
       // If YUV, convert to RGB and compress JPEG using Bitmap + ByteArrayOutputStream
       // return result via MethodChannel.Result.success(bytes)
   }
   ```

3) Do NOT write to DCIM. No MediaStore insert. This prevents "Media scan completed" logs.

Flutter side (UvcCameraService):

```dart
final bytes = await _ch.invokeMethod<Uint8List>('captureToBytes');
```

Approach B — Save to app-private cache without publishing

1) Write file under `context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)` or `cacheDir`.

2) Avoid adding to MediaStore (no insert, no broadcast). If using MediaStore (Android Q+), set `IS_PENDING=1` and delete before publish.

3) Expose method `takePictureToCache()` returning the file path. App can read and delete immediately.

Notes

- Current plugin `takePicture()` writes to DCIM/Camera and triggers MediaScanner automatically; even if the app deletes after use, the scan already occurred.
- Capturing to bytes or app-private storage eliminates DCIM pollution and reduces IO.

