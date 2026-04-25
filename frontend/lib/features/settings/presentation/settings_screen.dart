import 'package:flutter/material.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../core/theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _displayMode = 'auto'; // 'auto', 'mobile', 'tablet'

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuración'),
      ),
      drawer: const AppDrawer(),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          _buildSectionHeader('Preferencias de Pantalla'),
          Card(
            child: Column(
              children: [
                RadioListTile<String>(
                  title: const Text('Automático (Recomendado)'),
                  subtitle: const Text('Se adapta al tamaño de la pantalla actual.'),
                  value: 'auto',
                  groupValue: _displayMode,
                  onChanged: (val) => setState(() => _displayMode = val!),
                ),
                RadioListTile<String>(
                  title: const Text('Modo Móvil'),
                  subtitle: const Text('Fuerza el diseño vertical (una columna).'),
                  value: 'mobile',
                  groupValue: _displayMode,
                  onChanged: (val) => setState(() => _displayMode = val!),
                ),
                RadioListTile<String>(
                  title: const Text('Modo Tablet / Web'),
                  subtitle: const Text('Fuerza el diseño extendido (múltiples columnas).'),
                  value: 'tablet',
                  groupValue: _displayMode,
                  onChanged: (val) => setState(() => _displayMode = val!),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildSectionHeader('Sistema'),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.sync),
                  title: const Text('Sincronizar Datos'),
                  subtitle: const Text('Última sincronización: Hace 5 minutos'),
                  trailing: ElevatedButton(
                    onPressed: () {},
                    child: const Text('Sincronizar'),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('Versión de la App'),
                  trailing: const Text('1.0.0 (Beta)'),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 8.0),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: AppTheme.primaryBlue,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
