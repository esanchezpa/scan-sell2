import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'api_client.g.dart';

@riverpod
Dio apiClient(ApiClientRef ref) {
  final dio = Dio(BaseOptions(
    // In emulator 10.0.2.2 is localhost. On device it should be the local IP
    // Wait, since this is windows dev environment, probably running web or windows desktop?
    // Let's use localhost for web/desktop, 10.0.2.2 for android.
    // For now we'll configure it dynamically or fallback to localhost.
    baseUrl: const String.fromEnvironment('API_URL', defaultValue: 'http://localhost:8000/api/v1'),
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  dio.interceptors.add(LogInterceptor(
    request: true,
    requestHeader: true,
    requestBody: true,
    responseHeader: true,
    responseBody: true,
    error: true,
  ));

  return dio;
}
