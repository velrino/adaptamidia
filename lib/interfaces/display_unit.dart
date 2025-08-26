abstract class IDisplayContent {
  String get id;
  String get type;
  String get url;
  String get title;
  String? get description;
  int? get seconds;
  bool get isActive;

  Map<String, dynamic> toJson();
}

abstract class IDisplayUnit {
  String get id;
  String get name;
  String get unitId;
  List<IDisplayContent> get contents;
  bool get isActive;
  String get orientation;
  int get refreshInterval;

  Map<String, dynamic> toJson();
}

class DisplayContent implements IDisplayContent {
  @override
  final String id;
  @override
  final String type;
  @override
  final String url;
  @override
  final String title;
  @override
  final String? description;
  @override
  final int? seconds;
  @override
  final bool isActive;

  DisplayContent({
    required this.id,
    required this.type,
    required this.url,
    required this.title,
    this.description,
    this.seconds,
    required this.isActive,
  });

  factory DisplayContent.fromJson(Map<String, dynamic> json) {
    return DisplayContent(
      id: json['_id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      seconds: json['seconds'] is int
          ? json['seconds']
          : int.tryParse(json['seconds']?.toString() ?? ''),
      isActive: json['is_active'] == true,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'type': type,
      'url': url,
      'title': title,
      'description': description,
      'seconds': seconds,
      'is_active': isActive,
    };
  }
}

class DisplayUnit implements IDisplayUnit {
  @override
  final String id;
  @override
  final String name;
  @override
  final String unitId;
  @override
  final List<IDisplayContent> contents;
  @override
  final bool isActive;
  @override
  final String orientation;
  @override
  final int refreshInterval;

  DisplayUnit({
    required this.id,
    required this.name,
    required this.unitId,
    required this.contents,
    required this.isActive,
    required this.orientation,
    required this.refreshInterval,
  });

  factory DisplayUnit.fromJson(Map<String, dynamic> json) {
    final contentsList = (json['data'] as List<dynamic>?)
        ?.map((item) {
          if (item['type'] == 'NEWS' && item['news'] != null) {
            return DisplayContent.fromJson({
              '_id': item['news']['_id'],
              'type': 'NEWS',
              'url': item['news']['url'],
              'title': item['news']['title'],
              'description': item['news']['description'],
              'seconds': null,
              'is_active': item['news']['status'] == 'ACTIVE',
            });
          } else if (item['type'] == 'ADVERTISEMENT' && item['ads'] != null) {
            return DisplayContent.fromJson({
              '_id': item['ads']['_id'],
              'type': 'ADVERTISEMENT', 
              'url': item['ads']['source'],
              'title': item['ads']['title'],
              'description': null,
              'seconds': item['ads']['seconds'],
              'is_active': item['ads']['status'] == 'ACTIVE',
            });
          }
          return null;
        })
        .where((item) => item != null)
        .cast<IDisplayContent>()
        .toList() ?? [];

    final unit = json['unit'] as Map<String, dynamic>? ?? {};

    return DisplayUnit(
      id: unit['_id']?.toString() ?? '',
      name: unit['name']?.toString() ?? '',
      unitId: unit['_id']?.toString() ?? '',
      contents: contentsList,
      isActive: unit['status'] == 'ACTIVE' || unit['status'] == 'TEST',
      orientation: 'horizontal',
      refreshInterval: 30,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'unit_id': unitId,
      'contents': contents.map((content) => content.toJson()).toList(),
      'is_active': isActive,
      'orientation': orientation,
      'refresh_interval': refreshInterval,
    };
  }
}
