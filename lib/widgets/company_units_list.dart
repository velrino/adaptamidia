import 'package:flutter/material.dart';
import '../interfaces/company_unit.dart';
import '../services/company_units_service.dart';

class CompanyUnitsList extends StatefulWidget {
  const CompanyUnitsList({super.key});

  @override
  State<CompanyUnitsList> createState() => _CompanyUnitsListState();
}

class _CompanyUnitsListState extends State<CompanyUnitsList> {
  bool _isLoading = true;
  String? _error;
  Map<String, Map<String, Map<String, List<ICompanyUnit>>>> _groupedUnits = {};
  final TextEditingController _searchController = TextEditingController();
  String _currentSearch = '';
  final Map<String, ScrollController> _scrollControllers = {};

  @override
  void initState() {
    super.initState();
    _loadUnits();
  }

  @override
  void dispose() {
    _searchController.dispose();
    for (final controller in _scrollControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadUnits([String? search]) async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
        _currentSearch = search ?? '';
      });

      final response = await CompanyUnitsService.instance.getCompanyUnits(
        page: 1,
        limit: 100,
        search: search,
      );
      
      if (response != null) {
        final grouped = CompanyUnitsService.instance.groupUnitsByLocation(response.data);
        final sortedGrouped = CompanyUnitsService.instance.sortGroupedUnits(grouped);
        
        setState(() {
          _groupedUnits = sortedGrouped;
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = 'Não foi possível carregar as unidades';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar unidades: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) {
      return _buildLoadingState(isDark);
    }

    if (_error != null) {
      return _buildErrorState(isDark);
    }

    if (_groupedUnits.isEmpty) {
      return _buildEmptyState(isDark);
    }

    return _buildUnitsList(isDark);
  }

  Widget _buildLoadingState(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              'Carregando unidades...',
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: Colors.red[600],
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadUnits(_currentSearch),
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.business_outlined,
              size: 48,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhuma unidade encontrada',
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUnitsList(bool isDark) {
    return Column(
      children: [
        _buildSearchBar(isDark),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Unidades da Empresa',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.grey[900],
                  ),
                ),
                const SizedBox(height: 16),
                ..._buildGroupedUnits(isDark),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[850] : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
          ),
        ),
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Buscar unidades...',
          hintStyle: TextStyle(
            color: isDark ? Colors.grey[400] : Colors.grey[500],
          ),
          prefixIcon: Icon(
            Icons.search,
            color: isDark ? Colors.grey[400] : Colors.grey[500],
          ),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    _searchController.clear();
                    _loadUnits();
                  },
                  icon: Icon(
                    Icons.clear,
                    color: isDark ? Colors.grey[400] : Colors.grey[500],
                  ),
                )
              : null,
          filled: true,
          fillColor: isDark ? Colors.grey[800] : Colors.grey[50],
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        style: TextStyle(
          color: isDark ? Colors.white : Colors.grey[900],
        ),
        onSubmitted: (value) => _loadUnits(value.trim().isEmpty ? null : value.trim()),
        onChanged: (value) {
          setState(() {}); // Update suffixIcon visibility
        },
      ),
    );
  }

  List<Widget> _buildGroupedUnits(bool isDark) {
    final widgets = <Widget>[];

    for (final stateEntry in _groupedUnits.entries) {
      final state = stateEntry.key;
      final cities = stateEntry.value;

      widgets.add(_buildSectionHeader(state, isDark, level: 0));
      widgets.add(const SizedBox(height: 12));

      for (final cityEntry in cities.entries) {
        final city = cityEntry.key;
        final neighborhoods = cityEntry.value;

        widgets.add(_buildSectionHeader('$city, $state', isDark, level: 1));
        widgets.add(const SizedBox(height: 8));

        for (final neighborhoodEntry in neighborhoods.entries) {
          final neighborhood = neighborhoodEntry.key;
          final units = neighborhoodEntry.value;

          widgets.add(_buildSectionHeader(neighborhood, isDark, level: 2));
          widgets.add(const SizedBox(height: 8));

          widgets.add(_buildNetflixStyleRow(units, isDark, '${state}_${city}_$neighborhood'));
          widgets.add(const SizedBox(height: 32));
        }
      }
    }

    return widgets;
  }

  Widget _buildNetflixStyleRow(List<ICompanyUnit> units, bool isDark, String rowId) {
    // Get or create scroll controller for this row
    _scrollControllers[rowId] ??= ScrollController();
    final scrollController = _scrollControllers[rowId]!;

    const cardWidth = 280.0;
    const cardHeight = 280.0;
    const spacing = 16.0;

    return SizedBox(
      height: cardHeight + 60, // Extra space for navigation buttons
      child: Stack(
        children: [
          // Scrollable row
          Positioned.fill(
            child: SingleChildScrollView(
              controller: scrollController,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 50), // Space for nav buttons
              child: Row(
                children: units.asMap().entries.map((entry) {
                  final index = entry.key;
                  final unit = entry.value;
                  
                  return Container(
                    margin: EdgeInsets.only(
                      right: index < units.length - 1 ? spacing : 0,
                    ),
                    child: _buildNetflixCard(unit, isDark, cardWidth, cardHeight),
                  );
                }).toList(),
              ),
            ),
          ),
          // Left navigation button
          Positioned(
            left: 0,
            top: 0,
            bottom: 60,
            child: Center(
              child: AnimatedBuilder(
                animation: scrollController,
                builder: (context, child) {
                  final canScrollLeft = scrollController.hasClients && 
                      scrollController.position.hasContentDimensions &&
                      scrollController.offset > 0;
                  
                  return AnimatedOpacity(
                    opacity: canScrollLeft ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 200),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        onPressed: canScrollLeft ? () => _scrollLeft(scrollController, cardWidth + spacing) : null,
                        icon: const Icon(Icons.chevron_left, color: Colors.white, size: 24),
                        padding: EdgeInsets.zero,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          // Right navigation button
          Positioned(
            right: 0,
            top: 0,
            bottom: 60,
            child: Center(
              child: AnimatedBuilder(
                animation: scrollController,
                builder: (context, child) {
                  final canScrollRight = scrollController.hasClients && 
                      scrollController.position.hasContentDimensions &&
                      scrollController.offset < scrollController.position.maxScrollExtent;
                  
                  return AnimatedOpacity(
                    opacity: canScrollRight ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 200),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        onPressed: canScrollRight ? () => _scrollRight(scrollController, cardWidth + spacing) : null,
                        icon: const Icon(Icons.chevron_right, color: Colors.white, size: 24),
                        padding: EdgeInsets.zero,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _scrollLeft(ScrollController controller, double cardWidth) {
    if (!controller.hasClients || !controller.position.hasContentDimensions) return;
    
    final currentOffset = controller.offset;
    final targetOffset = (currentOffset - cardWidth * 2).clamp(0.0, controller.position.maxScrollExtent);
    
    controller.animateTo(
      targetOffset,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _scrollRight(ScrollController controller, double cardWidth) {
    if (!controller.hasClients || !controller.position.hasContentDimensions) return;
    
    final currentOffset = controller.offset;
    final targetOffset = (currentOffset + cardWidth * 2).clamp(0.0, controller.position.maxScrollExtent);
    
    controller.animateTo(
      targetOffset,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  Widget _buildNetflixCard(ICompanyUnit unit, bool isDark, double cardWidth, double cardHeight) {
    return Container(
      width: cardWidth,
      height: cardHeight,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[800] : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Status indicator at top
          Align(
            alignment: Alignment.topRight,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(unit.status).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _getStatusText(unit.status),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: _getStatusColor(unit.status),
                ),
              ),
            ),
          ),
          // Main content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Unit name
                Text(
                  unit.name,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.grey[900],
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                // Address
                Text(
                  unit.fullAddress,
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                    height: 1.4,
                  ),
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          // Type indicator at bottom
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.blue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _getTypeText(unit.type),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.blue[600],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark, {required int level}) {
    final fontSize = level == 0 ? 20.0 : (level == 1 ? 18.0 : 16.0);
    final fontWeight = level == 0 ? FontWeight.bold : (level == 1 ? FontWeight.w600 : FontWeight.w500);
    final color = level == 0 
        ? (isDark ? Colors.white : Colors.grey[900])
        : (level == 1 
            ? (isDark ? Colors.grey[300] : Colors.grey[700])
            : (isDark ? Colors.grey[400] : Colors.grey[600]));

    return Text(
      title,
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
      ),
    );
  }


  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return Colors.green[600]!;
      case 'TEST':
        return Colors.orange[600]!;
      case 'INACTIVE':
        return Colors.red[600]!;
      default:
        return Colors.grey[600]!;
    }
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Ativo';
      case 'TEST':
        return 'Teste';
      case 'INACTIVE':
        return 'Inativo';
      default:
        return status;
    }
  }

  String _getTypeText(String type) {
    switch (type.toUpperCase()) {
      case 'CAFE':
        return 'Café';
      case 'RESTAURANT':
        return 'Restaurante';
      case 'BAKERY':
        return 'Padaria';
      case 'BARBER_SHOP':
        return 'Barbearia';
      case 'JUICE_BAR':
        return 'Lanchonete';
      default:
        return type.replaceAll('_', ' ');
    }
  }
}