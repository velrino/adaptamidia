abstract class ICompanyUnit {
  String get id;
  String get name;
  String get fullAddress;
  String get neighborhood;
  String get city;
  String get state;
  String get country;
  String get type;
  String get status;
  
  Map<String, dynamic> toJson();
}

abstract class ICompany {
  String get id;
  String get name;
  String get document;
  String get documentType;
  String get type;
  String get status;
  
  Map<String, dynamic> toJson();
}

abstract class ICompanyUnitsResponse {
  int get pages;
  int get total;
  List<ICompanyUnit> get data;
  int get limit;
  int get page;
  
  Map<String, dynamic> toJson();
}

class Company implements ICompany {
  @override
  final String id;
  @override
  final String name;
  @override
  final String document;
  @override
  final String documentType;
  @override
  final String type;
  @override
  final String status;

  Company({
    required this.id,
    required this.name,
    required this.document,
    required this.documentType,
    required this.type,
    required this.status,
  });

  factory Company.fromJson(Map<String, dynamic> json) {
    return Company(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      document: json['document']?.toString() ?? '',
      documentType: json['document_type']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'document': document,
      'document_type': documentType,
      'type': type,
      'status': status,
    };
  }
}

class CompanyUnit implements ICompanyUnit {
  @override
  final String id;
  @override
  final String name;
  @override
  final String fullAddress;
  @override
  final String neighborhood;
  @override
  final String city;
  @override
  final String state;
  @override
  final String country;
  @override
  final String type;
  @override
  final String status;
  final Company company;

  CompanyUnit({
    required this.id,
    required this.name,
    required this.fullAddress,
    required this.neighborhood,
    required this.city,
    required this.state,
    required this.country,
    required this.type,
    required this.status,
    required this.company,
  });

  factory CompanyUnit.fromJson(Map<String, dynamic> json) {
    return CompanyUnit(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      fullAddress: json['full_address']?.toString() ?? '',
      neighborhood: json['neighborhood']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      country: json['country']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      company: Company.fromJson(json['company'] ?? {}),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'full_address': fullAddress,
      'neighborhood': neighborhood,
      'city': city,
      'state': state,
      'country': country,
      'type': type,
      'status': status,
      'company': company.toJson(),
    };
  }
}

class CompanyUnitsResponse implements ICompanyUnitsResponse {
  @override
  final int pages;
  @override
  final int total;
  @override
  final List<ICompanyUnit> data;
  @override
  final int limit;
  @override
  final int page;

  CompanyUnitsResponse({
    required this.pages,
    required this.total,
    required this.data,
    required this.limit,
    required this.page,
  });

  factory CompanyUnitsResponse.fromJson(Map<String, dynamic> json) {
    final dataList = (json['data'] as List<dynamic>?)
        ?.map((item) => CompanyUnit.fromJson(item))
        .cast<ICompanyUnit>()
        .toList() ?? [];

    return CompanyUnitsResponse(
      pages: json['pages'] is int ? json['pages'] : int.tryParse(json['pages']?.toString() ?? '0') ?? 0,
      total: json['total'] is int ? json['total'] : int.tryParse(json['total']?.toString() ?? '0') ?? 0,
      data: dataList,
      limit: json['limit'] is int ? json['limit'] : int.tryParse(json['limit']?.toString() ?? '0') ?? 0,
      page: json['page'] is int ? json['page'] : int.tryParse(json['page']?.toString() ?? '0') ?? 0,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'pages': pages,
      'total': total,
      'data': data.map((unit) => unit.toJson()).toList(),
      'limit': limit,
      'page': page,
    };
  }
}