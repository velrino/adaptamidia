abstract class IAuthData {
  String get accessToken;
  String get expiresIn;
  String get id;
  String get session;
  int get iat;
  int get exp;

  Map<String, dynamic> toJson();
}

class IAuthResponse implements IAuthData {
  @override
  final String accessToken;
  @override
  final String expiresIn;
  @override
  final String id;
  @override
  final String session;
  @override
  final int iat;
  @override
  final int exp;

  IAuthResponse({
    required this.accessToken,
    required this.expiresIn,
    required this.id,
    required this.session,
    required this.iat,
    required this.exp,
  });

  factory IAuthResponse.fromJson(Map<String, dynamic> json) {
    return IAuthResponse(
      accessToken: json['access_token']?.toString() ?? '',
      expiresIn: json['expires_in']?.toString() ?? '',
      id: json['id']?.toString() ?? '',
      session: json['session']?.toString() ?? '',
      iat: json['iat'] is int
          ? json['iat']
          : int.tryParse(json['iat']?.toString() ?? '0') ?? 0,
      exp: json['exp'] is int
          ? json['exp']
          : int.tryParse(json['exp']?.toString() ?? '0') ?? 0,
    );
  }

  @override
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
