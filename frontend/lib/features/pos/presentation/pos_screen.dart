import 'package:flutter/material.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/barcode_listener.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({super.key});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  final List<Map<String, dynamic>> _cart = [];
  double get _total => _cart.fold(0, (sum, item) => sum + (item['price'] * item['quantity']));

  void _onBarcodeScanned(String barcode) {
    // Mocking adding a product
    setState(() {
      final existingIndex = _cart.indexWhere((item) => item['barcode'] == barcode);
      if (existingIndex >= 0) {
        _cart[existingIndex]['quantity']++;
      } else {
        _cart.add({
          'barcode': barcode,
          'name': 'Producto Scaneado ($barcode)',
          'price': 15.50,
          'quantity': 1,
        });
      }
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Producto $barcode agregado'),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isTabletOrWeb = MediaQuery.of(context).size.width > 600;

    return BarcodeListener(
      onBarcodeScanned: _onBarcodeScanned,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Punto de Venta'),
          actions: [
            IconButton(
              icon: const Icon(Icons.qr_code_scanner),
              onPressed: () {
                // Open camera scanner
              },
              tooltip: 'Escanear con Cámara',
            ),
          ],
        ),
        drawer: const AppDrawer(),
        body: isTabletOrWeb ? _buildTabletLayout() : _buildMobileLayout(),
      ),
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      children: [
        _buildCartList(),
        _buildCheckoutPanel(),
      ],
    );
  }

  Widget _buildTabletLayout() {
    return Row(
      children: [
        // Left side: Cart
        Expanded(
          flex: 6,
          child: Column(
            children: [
              _buildCartList(),
              _buildCheckoutPanel(),
            ],
          ),
        ),
        const VerticalDivider(width: 1),
        // Right side: Quick actions or numpad
        Expanded(
          flex: 4,
          child: Container(
            color: AppTheme.surfaceWhite,
            child: _buildQuickActions(),
          ),
        ),
      ],
    );
  }

  Widget _buildCartList() {
    return Expanded(
      child: _cart.isEmpty
          ? const Center(
              child: Text(
                'Escanea un producto para comenzar\no búscalo manualmente.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
              ),
            )
          : ListView.separated(
              itemCount: _cart.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = _cart[index];
                return ListTile(
                  title: Text(item['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('\$${item['price'].toStringAsFixed(2)} x ${item['quantity']}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '\$${(item['price'] * item['quantity']).toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                        onPressed: () {
                          setState(() {
                            _cart.removeAt(index);
                          });
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildCheckoutPanel() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppTheme.surfaceWhite,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, -4),
            blurRadius: 10,
          )
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total:', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text('\$${_total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue)),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _cart.isEmpty ? null : () {
                // Checkout process
                setState(() => _cart.clear());
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Venta completada con éxito')),
                );
              },
              child: const Text('COBRAR', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return GridView.count(
      padding: const EdgeInsets.all(16),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      children: [
        _buildActionCard('Buscar\nProducto', Icons.search, Colors.blue),
        _buildActionCard('Descuento', Icons.percent, Colors.orange),
        _buildActionCard('Cancelar\nVenta', Icons.cancel_outlined, Colors.red, onTap: () => setState(() => _cart.clear())),
        _buildActionCard('Clientes', Icons.people_outline, Colors.green),
      ],
    );
  }

  Widget _buildActionCard(String title, IconData icon, Color color, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
