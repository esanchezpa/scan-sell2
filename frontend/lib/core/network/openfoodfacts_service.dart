import 'package:dio/dio.dart';

class OpenFoodFactsService {
  final Dio _dio;

  OpenFoodFactsService(this._dio);

  Future<Map<String, dynamic>?> getProductByBarcode(String barcode) async {
    try {
      final response = await _dio.get('https://world.openfoodfacts.org/api/v2/product/$barcode.json');
      if (response.statusCode == 200) {
        final data = response.data;
        if (data['status'] == 1) {
          final product = data['product'];
          return {
            'name': product['product_name'] ?? product['product_name_es'] ?? 'Producto Desconocido',
            'image_url': product['image_front_url'],
            'brand': product['brands'],
          };
        }
      }
      return null;
    } catch (e) {
      print('Error fetching from OpenFoodFacts: $e');
      return null;
    }
  }
}
