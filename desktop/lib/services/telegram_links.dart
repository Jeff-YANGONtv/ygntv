import 'package:url_launcher/url_launcher.dart';

Uri? parseTelegramWatchUrl(String? value) {
  final uri = Uri.tryParse(value?.trim() ?? '');
  if (uri == null || uri.scheme.toLowerCase() != 'https') return null;
  final host = uri.host.toLowerCase();
  if (host != 't.me' && host != 'telegram.me' && host != 'www.telegram.me') {
    return null;
  }
  return uri;
}

Future<bool> launchTelegramWatch(String? value) async {
  final uri = parseTelegramWatchUrl(value);
  if (uri == null) return false;
  try {
    return await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    return false;
  }
}
