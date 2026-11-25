import '../interfaces/display_unit.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class DisplayService {
  static DisplayService? _instance;
  static DisplayService get instance =>
      _instance ??= DisplayService._internal();

  DisplayService._internal();

  Future<IDisplayUnit?> getDisplayUnit(String unitId) async {
    try {
      final token = await StorageService.getAuthToken();
      if (token == null) {
        throw Exception('No auth token found');
      }

      final response = await ApiService.get(
        '/display/unit/$unitId',
        DisplayUnit.fromJson,
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.success && response.data != null) {
        return response.data;
      } else {
        throw Exception(response.error ?? 'Failed to fetch display unit');
      }
    } catch (e) {
      return null;
    }
  }

  void logContentCompletion({
    required String unitId,
    required String contentId,
    required String contentType,
    required String contentTitle,
    required int displayDuration,
    required DateTime startTime,
    required DateTime endTime,
  }) {
    // Future: Send log data to server
    // For now, content completion is tracked locally
  }
}
