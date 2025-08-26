import '../interfaces/company_unit.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class CompanyUnitsService {
  static CompanyUnitsService? _instance;
  static CompanyUnitsService get instance => _instance ??= CompanyUnitsService._internal();
  
  CompanyUnitsService._internal();

  /// Fetches company units from the API
  Future<ICompanyUnitsResponse?> getCompanyUnits({
    int page = 1,
    int limit = 100,
    String? search,
  }) async {
    try {
      // Get auth token from storage
      final token = await StorageService.getAuthToken();
      if (token == null) {
        throw Exception('No auth token found');
      }

      // Build query parameters
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final uri = Uri(
        path: '/company/unit',
        queryParameters: queryParams,
      );

      final response = await ApiService.get(
        uri.toString(),
        CompanyUnitsResponse.fromJson,
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.success && response.data != null) {
        return response.data;
      } else {
        throw Exception(response.error ?? 'Failed to fetch company units');
      }
    } catch (e) {
      print('Error fetching company units: $e');
      return null;
    }
  }

  /// Groups units by state, city, and neighborhood
  Map<String, Map<String, Map<String, List<ICompanyUnit>>>> groupUnitsByLocation(
    List<ICompanyUnit> units,
  ) {
    final grouped = <String, Map<String, Map<String, List<ICompanyUnit>>>>{};

    // Sort units alphabetically by name first
    final sortedUnits = List<ICompanyUnit>.from(units)
      ..sort((a, b) => a.name.compareTo(b.name));

    for (final unit in sortedUnits) {
      final state = unit.state.isEmpty ? 'Outros' : unit.state;
      final city = unit.city.isEmpty ? 'Outras' : unit.city;
      final neighborhood = unit.neighborhood.isEmpty ? 'Outros' : unit.neighborhood;

      // Initialize nested maps if they don't exist
      grouped[state] ??= <String, Map<String, List<ICompanyUnit>>>{};
      grouped[state]![city] ??= <String, List<ICompanyUnit>>{};
      grouped[state]![city]![neighborhood] ??= <ICompanyUnit>[];

      grouped[state]![city]![neighborhood]!.add(unit);
    }

    return grouped;
  }

  /// Sorts grouped locations alphabetically
  Map<String, Map<String, Map<String, List<ICompanyUnit>>>> sortGroupedUnits(
    Map<String, Map<String, Map<String, List<ICompanyUnit>>>> grouped,
  ) {
    final sortedGrouped = <String, Map<String, Map<String, List<ICompanyUnit>>>>{};

    // Sort states
    final sortedStates = grouped.keys.toList()..sort();
    
    for (final state in sortedStates) {
      sortedGrouped[state] = <String, Map<String, List<ICompanyUnit>>>{};
      
      // Sort cities
      final sortedCities = grouped[state]!.keys.toList()..sort();
      
      for (final city in sortedCities) {
        sortedGrouped[state]![city] = <String, List<ICompanyUnit>>{};
        
        // Sort neighborhoods
        final sortedNeighborhoods = grouped[state]![city]!.keys.toList()..sort();
        
        for (final neighborhood in sortedNeighborhoods) {
          sortedGrouped[state]![city]![neighborhood] = grouped[state]![city]![neighborhood]!;
        }
      }
    }

    return sortedGrouped;
  }
}