import 'package:flutter_test/flutter_test.dart';
import 'package:ygntv_desktop/auth/auth_service.dart';

void main() {
  test('parses media and episode Telegram Watch links from API JSON', () {
    final item = CatalogItem.fromJson({
      'id': 31,
      'slug': 'sample-series',
      'title': 'Sample Series',
      'poster': 'https://images.example/poster.jpg',
      'telegram_post_url': 'https://t.me/ygntv/31',
      'seasons': [
        {
          'id': 4,
          'season_number': 1,
          'title': 'Season 1',
          'episodes': [
            {
              'id': 9,
              'episode_number': 1,
              'title': 'First Episode',
              'available': true,
              'telegram_post_url': 'https://t.me/ygntv/32',
            },
          ],
        },
      ],
    }, 'series');

    expect(item.telegramPostUrl, 'https://t.me/ygntv/31');
    expect(item.seasons, hasLength(1));
    expect(
      item.seasons.single.episodes.single.telegramPostUrl,
      'https://t.me/ygntv/32',
    );
  });
}
