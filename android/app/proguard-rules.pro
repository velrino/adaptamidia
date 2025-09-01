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

# Firebase (Auth/Database/Storage) – keep to avoid stripping required classes in release
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.android.datatransport.** { *; }
-dontwarn com.google.android.datatransport.**

# SnakeYAML / java.beans (Android does not ship java.beans; suppress warnings and keep YAML if present)
-dontwarn java.beans.**
-dontwarn org.yaml.snakeyaml.**
-keep class org.yaml.snakeyaml.** { *; }
