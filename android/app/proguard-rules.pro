# Flutter UVC Camera ProGuard Rules
-keep class com.jiangdg.uvc.UVCCamera {
    native <methods>;
    long mNativePtr;
}
-keep class com.jiangdg.uvc.IStatusCallback {
    *;
}
-keep interface com.jiangdg.uvc.IButtonCallback {
    *;
}

# VLC Player ProGuard Rules
-keep class org.videolan.libvlc.** { *; }