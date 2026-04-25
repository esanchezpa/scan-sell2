import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final currentPath = GoRouterState.of(context).uri.path;

    return Drawer(
      backgroundColor: AppTheme.backgroundWhite,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: AppTheme.primaryBlue,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Icon(Icons.storefront, size: 48, color: Colors.white),
                const SizedBox(height: 8),
                Text(
                  'VentaFácil',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          _DrawerItem(
            icon: Icons.dashboard_outlined,
            title: 'Dashboard',
            isSelected: currentPath == '/',
            onTap: () => context.goNamed('home'),
          ),
          _DrawerItem(
            icon: Icons.point_of_sale,
            title: 'POS (Ventas)',
            isSelected: currentPath == '/pos',
            onTap: () => context.goNamed('pos'),
          ),
          _DrawerItem(
            icon: Icons.inventory_2_outlined,
            title: 'Catálogo',
            isSelected: currentPath == '/catalog',
            onTap: () => context.goNamed('catalog'),
          ),
          _DrawerItem(
            icon: Icons.warehouse_outlined,
            title: 'Inventario',
            isSelected: currentPath == '/inventory',
            onTap: () => context.goNamed('inventory'),
          ),
          const Divider(),
          _DrawerItem(
            icon: Icons.settings_outlined,
            title: 'Configuración',
            isSelected: currentPath == '/settings',
            onTap: () => context.goNamed('settings'),
          ),
        ],
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool isSelected;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.title,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? AppTheme.primaryBlue : AppTheme.textMuted,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? AppTheme.primaryBlue : AppTheme.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: AppTheme.lightBlue,
      onTap: () {
        Navigator.pop(context); // Close drawer
        onTap();
      },
    );
  }
}
