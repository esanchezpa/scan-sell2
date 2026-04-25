import 'package:flutter/material.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../core/theme/app_theme.dart';

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventario y Stock'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_box_outlined),
            onPressed: () {
              // Register new stock entry
            },
            tooltip: 'Ajuste de Stock',
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      'Niveles de Stock',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingTextStyle: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textMuted,
                      ),
                      columns: const [
                        DataColumn(label: Text('Producto')),
                        DataColumn(label: Text('Stock Actual')),
                        DataColumn(label: Text('Mínimo')),
                        DataColumn(label: Text('Estado')),
                        DataColumn(label: Text('Acciones')),
                      ],
                      rows: List.generate(
                        5,
                        (index) {
                          final stock = 50 - (index * 12);
                          final isLow = stock <= 5;
                          
                          return DataRow(
                            cells: [
                              DataCell(Text('Producto $index')),
                              DataCell(Text(stock.toString(), style: TextStyle(fontWeight: FontWeight.bold, color: isLow ? Colors.red : null))),
                              const DataCell(Text('5')),
                              DataCell(
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isLow ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    isLow ? 'Bajo Stock' : 'Óptimo',
                                    style: TextStyle(
                                      color: isLow ? Colors.red : Colors.green,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                              DataCell(
                                IconButton(
                                  icon: const Icon(Icons.edit_note, size: 20),
                                  onPressed: () {},
                                  color: AppTheme.primaryBlue,
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
