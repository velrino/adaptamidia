class DeviceGenerateRequest {
  final String id;

  DeviceGenerateRequest({required this.id});

  Map<String, dynamic> toJson() {
    return {
      'id': id,
    };
  }

  factory DeviceGenerateRequest.fromJson(Map<String, dynamic> json) {
    return DeviceGenerateRequest(
      id: json['id'] as String,
    );
  }
}

class DeviceGenerateResponse {
  final DateTime expiresIn;
  final String id;
  final String code;
  final String qrCode;

  DeviceGenerateResponse({
    required this.expiresIn,
    required this.id,
    required this.code,
    required this.qrCode,
  });

  factory DeviceGenerateResponse.fromJson(Map<String, dynamic> json) {
    return DeviceGenerateResponse(
      expiresIn: DateTime.parse(json['expires_in'] as String),
      id: json['id'] as String,
      code: json['code'] as String,
      qrCode: json['qr_code'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'expires_in': expiresIn.toIso8601String(),
      'id': id,
      'code': code,
      'qr_code': qrCode,
    };
  }

  bool get isExpired => DateTime.now().isAfter(expiresIn);
  
  Duration get timeUntilExpiry => expiresIn.difference(DateTime.now());
  
  String get formattedCode => code.split('').join(' ');
}

class DeviceAuthStatus {
  final String id;
  final String status;
  final String? token;
  final String? message;
  final DateTime? authenticatedAt;

  DeviceAuthStatus({
    required this.id,
    required this.status,
    this.token,
    this.message,
    this.authenticatedAt,
  });

  factory DeviceAuthStatus.fromJson(Map<String, dynamic> json) {
    return DeviceAuthStatus(
      id: json['id'] as String,
      status: json['status'] as String,
      token: json['token'] as String?,
      message: json['message'] as String?,
      authenticatedAt: json['authenticated_at'] != null
          ? DateTime.parse(json['authenticated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'token': token,
      'message': message,
      'authenticated_at': authenticatedAt?.toIso8601String(),
    };
  }

  bool get isPending => status == 'pending';
  bool get isAuthenticated => status == 'authenticated';
  bool get isExpired => status == 'expired';
  bool get isRejected => status == 'rejected';
}