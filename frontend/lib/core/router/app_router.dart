import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/catalog/presentation/catalog_screen.dart';
import '../../features/inventory/presentation/inventory_screen.dart';

part 'app_router.g.dart';

// Dummy screens for Phase 3 to satisfy the router
class DummyScreen extends StatelessWidget {
  final String title;
  const DummyScreen({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(child: Text('Placeholder for $title')),
    );
  }
}

@riverpod
GoRouter appRouter(AppRouterRef ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/catalog',
        name: 'catalog',
        builder: (context, state) => const CatalogScreen(),
      ),
      GoRoute(
        path: '/inventory',
        name: 'inventory',
        builder: (context, state) => const InventoryScreen(),
      ),
      GoRoute(
        path: '/pos',
        name: 'pos',
        builder: (context, state) => const DummyScreen(title: 'POS'),
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const DummyScreen(title: 'Settings'),
      ),
    ],
  );
}
