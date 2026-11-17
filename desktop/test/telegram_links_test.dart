import 'package:flutter_test/flutter_test.dart';
import 'package:ygntv_desktop/services/telegram_links.dart';

void main() {
  group('parseTelegramWatchUrl', () {
    test('accepts secure Telegram post links', () {
      expect(
        parseTelegramWatchUrl('https://t.me/ygntv/123'),
        Uri.parse('https://t.me/ygntv/123'),
      );
      expect(
        parseTelegramWatchUrl('https://telegram.me/channel/456'),
        Uri.parse('https://telegram.me/channel/456'),
      );
    });

    test('rejects non-Telegram hosts and non-HTTPS links', () {
      expect(parseTelegramWatchUrl('https://example.com/watch'), isNull);
      expect(parseTelegramWatchUrl('http://t.me/ygntv/123'), isNull);
      expect(parseTelegramWatchUrl('javascript:alert(1)'), isNull);
      expect(parseTelegramWatchUrl(null), isNull);
    });
  });
}
