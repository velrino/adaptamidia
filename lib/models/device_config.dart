class DeviceConfig {
  final String orientation;
  final double screenWidth;
  final double screenHeight;
  final double pixelRatio;
  final String deviceModel;
  final DateTime configuredAt;

  DeviceConfig({
    required this.orientation,
    required this.screenWidth,
    required this.screenHeight,
    required this.pixelRatio,
    required this.deviceModel,
    required this.configuredAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'orientation': orientation,
      'screenWidth': screenWidth,
      'screenHeight': screenHeight,
      'pixelRatio': pixelRatio,
      'deviceModel': deviceModel,
      'configuredAt': configuredAt.toIso8601String(),
    };
  }

  factory DeviceConfig.fromJson(Map<String, dynamic> json) {
    return DeviceConfig(
      orientation: json['orientation'] as String,
      screenWidth: json['screenWidth'] as double,
      screenHeight: json['screenHeight'] as double,
      pixelRatio: json['pixelRatio'] as double,
      deviceModel: json['deviceModel'] as String,
      configuredAt: DateTime.parse(json['configuredAt'] as String),
    );
  }

  bool get isLandscape => orientation == 'landscape';
  bool get isPortrait => orientation == 'portrait';
  
  double get aspectRatio => screenWidth / screenHeight;
}