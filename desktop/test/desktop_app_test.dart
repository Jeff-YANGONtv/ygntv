import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ygntv_desktop/auth/auth_service.dart';
import 'package:ygntv_desktop/desktop_app.dart';

class _FakeAuthService extends AuthService {
  _FakeAuthService({this.failOptional = false})
    : super(client: MockClient((_) async => http.Response('{}', 200)));

  final bool failOptional;

  @override
  Future<List<TvHomeBanner>> getTopAdBanners() async {
    if (failOptional) throw Exception('banner endpoint unavailable');
    return const [];
  }

  @override
  Future<List<TvBlogPost>> getBlogPosts({int page = 1}) async {
    if (failOptional) throw Exception('blog endpoint unavailable');
    return [_blogPost];
  }

  @override
  Future<TvBlogPost> getBlogPost(String slug) async => _blogPost;

  @override
  Future<List<CatalogItem>> loadCatalog(
    String kind, {
    int page = 1,
    int perPage = 48,
  }) async {
    if (kind == 'movie') return [_movie];
    return [_series];
  }

  @override
  Future<CatalogItem> loadDetail(CatalogItem item) async =>
      item.kind == 'series' ? _series : _movie;

  @override
  Future<List<CatalogItem>> searchCatalog(String query) async =>
      query.toLowerCase().contains('pilot') ? [_series] : [_movie];
}

const _movie = CatalogItem(
  id: 11,
  slug: 'sample-movie',
  title: 'Sample Movie',
  posterUrl: '',
  kind: 'movie',
  year: '2026',
  synopsis: 'A test movie review.',
);

const _series = CatalogItem(
  id: 22,
  slug: 'sample-series',
  title: 'Sample Series',
  posterUrl: '',
  kind: 'series',
  seasons: [
    CatalogSeason(
      id: null,
      number: 1,
      title: 'Season 1',
      episodes: [
        CatalogEpisode(
          id: 101,
          number: 1,
          title: 'Pilot',
          telegramPostUrl: 'https://t.me/ygntv/101',
        ),
      ],
    ),
    CatalogSeason(
      id: null,
      number: 2,
      title: 'Season 2',
      episodes: [
        CatalogEpisode(
          id: 102,
          number: 1,
          title: 'Finale',
          telegramPostUrl: 'https://t.me/ygntv/102',
        ),
      ],
    ),
  ],
);

const _blogPost = TvBlogPost(
  id: '1',
  slug: 'sample-story',
  title: 'Sample Story',
  excerpt: 'A test article.',
  date: '2026-01-01',
  category: 'News',
  author: 'Yangon TV',
  image: '',
  content: '<p>Readable article text.</p>',
);

void main() {
  late _FakeAuthService service;

  setUp(() {
    service = _FakeAuthService();
  });

  Future<void> openApp(
    WidgetTester tester, {
    Size size = const Size(1280, 720),
  }) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    await tester.pumpWidget(YgntvDesktopApp(service: service));
    await tester.pumpAndSettle();
  }

  tearDown(() {
    service.dispose();
  });

  testWidgets('desktop home renders and Explore goes to the movie catalog', (
    tester,
  ) async {
    await openApp(tester);

    expect(find.text('Stories worth staying up for.'), findsOneWidget);
    expect(find.text('Movies'), findsWidgets);
    await tester.tap(find.text('Explore collection'));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('title-11-movie')), findsOneWidget);
  });

  testWidgets('Home stays usable if optional banner and Blog requests fail', (
    tester,
  ) async {
    service = _FakeAuthService(failOptional: true);
    await openApp(tester);

    expect(find.text('Stories worth staying up for.'), findsOneWidget);
    expect(find.byKey(const ValueKey('nav-movies')), findsOneWidget);
  });

  testWidgets('movie detail keeps Review, Watch and honest Download tabs', (
    tester,
  ) async {
    await openApp(tester);
    await tester.tap(find.byKey(const ValueKey('nav-movies')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('title-11-movie')));
    await tester.pumpAndSettle();

    expect(find.text('Review'), findsWidgets);
    expect(find.text('Watch'), findsOneWidget);
    expect(find.text('Download'), findsOneWidget);
    expect(find.text('A test movie review.'), findsWidgets);

    await tester.tap(find.text('Download'));
    await tester.pumpAndSettle();
    expect(
      find.text('Downloads are unavailable in this desktop preview.'),
      findsOneWidget,
    );
  });

  testWidgets('season guide uses season numbers when API IDs are null', (
    tester,
  ) async {
    await openApp(tester);
    await tester.tap(find.byKey(const ValueKey('nav-series')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('title-22-series')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Watch'));
    await tester.pumpAndSettle();

    expect(find.text('Episode 1 · Pilot'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('season-22-null')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Season 2').last);
    await tester.pumpAndSettle();

    expect(find.text('Episode 1 · Finale'), findsOneWidget);
  });

  testWidgets('search opens the matching result', (tester) async {
    await openApp(tester);
    await tester.tap(find.byKey(const ValueKey('nav-search')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('catalog-search-field')),
      'pilot',
    );
    await tester.tap(find.byKey(const ValueKey('catalog-search-button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('title-22-series')), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('title-22-series')));
    await tester.pumpAndSettle();
    expect(find.text('A test movie review.'), findsNothing);
    expect(find.byKey(const ValueKey('title-22-series')), findsNothing);
  });

  testWidgets('Blog list opens a readable article detail', (tester) async {
    await openApp(tester);
    await tester.tap(find.byKey(const ValueKey('nav-blog')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const ValueKey('blog-sample-story')));
    await tester.pumpAndSettle();

    expect(find.text('Sample Story'), findsWidgets);
    expect(find.text('A test article.'), findsOneWidget);
    expect(find.text('Readable article text.'), findsOneWidget);
  });

  testWidgets(
    'desktop shell fits a compact landscape window without overflow',
    (tester) async {
      await openApp(tester, size: const Size(1120, 630));
      expect(tester.takeException(), isNull);
      expect(find.byKey(const ValueKey('nav-home')), findsOneWidget);
      expect(find.byKey(const ValueKey('nav-blog')), findsOneWidget);
    },
  );
}
