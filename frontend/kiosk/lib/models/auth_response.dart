class AuthResponse {
  final String accessToken;
  final String expiresIn;
  final String id;
  final String session;
  final int iat;
  final int exp;

  AuthResponse({
    required this.accessToken,
    required this.expiresIn,
    required this.id,
    required this.session,
    required this.iat,
    required this.exp,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token']?.toString() ?? '',
      expiresIn: json['expires_in']?.toString() ?? '',
      id: json['id']?.toString() ?? '',
      session: json['session']?.toString() ?? '',
      iat: json['iat'] is int ? json['iat'] : int.tryParse(json['iat']?.toString() ?? '0') ?? 0,
      exp: json['exp'] is int ? json['exp'] : int.tryParse(json['exp']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'access_token': accessToken,
      'expires_in': expiresIn,
      'id': id,
      'session': session,
      'iat': iat,
      'exp': exp,
    };
  }
}