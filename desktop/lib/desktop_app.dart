import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';

import 'auth/auth_service.dart';
import 'services/telegram_links.dart';

const _ink = Color(0xFF08090B);
const _panel = Color(0xFF111317);
const _panelRaised = Color(0xFF1A1D22);
const _red = Color(0xFFE53945);
const _gold = Color(0xFFE8C27E);
const _muted = Color(0xFF9AA1AC);

class YgntvDesktopApp extends StatelessWidget {
  const YgntvDesktopApp({super.key, required this.service});

  final AuthService service;

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Yangon TV',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: _ink,
      colorScheme: const ColorScheme.dark(
        primary: _red,
        secondary: _gold,
        surface: _panel,
        error: Color(0xFFFF6B6B),
      ),
      useMaterial3: true,
      fontFamily: 'Segoe UI',
      appBarTheme: const AppBarTheme(
        backgroundColor: _ink,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: _panel,
        surfaceTintColor: Colors.transparent,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _panelRaised,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: .08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _red),
        ),
      ),
    ),
    home: _DesktopShell(service: service),
  );
}

enum _Section { home, movies, series, search, blog }

class _DesktopShell extends StatefulWidget {
  const _DesktopShell({required this.service});

  final AuthService service;

  @override
  State<_DesktopShell> createState() => _DesktopShellState();
}

class _DesktopShellState extends State<_DesktopShell> {
  _Section _section = _Section.home;
  CatalogItem? _selectedItem;
  TvBlogPost? _selectedBlog;

  void _navigate(_Section section) {
    setState(() {
      _section = section;
      _selectedItem = null;
      _selectedBlog = null;
    });
  }

  void _openItem(CatalogItem item) {
    setState(() {
      _selectedItem = item;
      _selectedBlog = null;
    });
  }

  void _openBlog(TvBlogPost post) {
    setState(() {
      _selectedBlog = post;
      _selectedItem = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDetail = _selectedItem != null || _selectedBlog != null;
    return Scaffold(
      body: Row(
        children: [
          _Sidebar(section: _section, onSelect: _navigate),
          const VerticalDivider(
            width: 1,
            thickness: 1,
            color: Color(0xFF22252A),
          ),
          Expanded(
            child: Column(
              children: [
                _TopBar(
                  title: isDetail
                      ? (_selectedItem?.title ?? _selectedBlog!.title)
                      : _section.title,
                  onBack: isDetail
                      ? () => setState(() {
                          _selectedItem = null;
                          _selectedBlog = null;
                        })
                      : null,
                ),
                Expanded(child: _buildBody()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_selectedItem case final item?) {
      return _DetailPage(
        key: ValueKey('detail-${item.kind}-${item.id}-${item.slug}'),
        service: widget.service,
        item: item,
      );
    }
    if (_selectedBlog case final post?) {
      return _BlogDetailPage(
        key: ValueKey('blog-${post.slug}'),
        service: widget.service,
        post: post,
      );
    }
    return switch (_section) {
      _Section.home => _HomePage(
        service: widget.service,
        onOpen: _openItem,
        onOpenBlog: _openBlog,
        onExplore: () => _navigate(_Section.movies),
      ),
      _Section.movies => _CatalogPage(
        key: const ValueKey('movies'),
        service: widget.service,
        kind: 'movie',
        onOpen: _openItem,
      ),
      _Section.series => _CatalogPage(
        key: const ValueKey('series'),
        service: widget.service,
        kind: 'series',
        onOpen: _openItem,
      ),
      _Section.search => _SearchPage(
        service: widget.service,
        onOpen: _openItem,
      ),
      _Section.blog => _BlogPage(service: widget.service, onOpen: _openBlog),
    };
  }
}

extension on _Section {
  String get title => switch (this) {
    _Section.home => 'Home',
    _Section.movies => 'Movies',
    _Section.series => 'Series',
    _Section.search => 'Search',
    _Section.blog => 'Blog',
  };

  IconData get icon => switch (this) {
    _Section.home => Icons.home_rounded,
    _Section.movies => Icons.local_movies_rounded,
    _Section.series => Icons.video_library_rounded,
    _Section.search => Icons.search_rounded,
    _Section.blog => Icons.article_rounded,
  };
}

class _Sidebar extends StatelessWidget {
  const _Sidebar({required this.section, required this.onSelect});

  final _Section section;
  final ValueChanged<_Section> onSelect;

  @override
  Widget build(BuildContext context) => Container(
    width: 220,
    color: const Color(0xFF0C0D10),
    padding: const EdgeInsets.fromLTRB(16, 22, 12, 18),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 58,
          child: Row(
            children: [
              SizedBox(
                width: 52,
                height: 52,
                child: SvgPicture.asset(
                  'assets/brand/yangon-tv-logo-transparent.svg',
                  fit: BoxFit.contain,
                  semanticsLabel: 'Yangon TV logo',
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'YANGON TV',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.3,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 34),
        const Padding(
          padding: EdgeInsets.only(left: 12, bottom: 10),
          child: Text(
            'DISCOVER',
            style: TextStyle(
              color: _muted,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.4,
            ),
          ),
        ),
        for (final item in _Section.values)
          _NavTile(item: item, selected: item == section, onSelect: onSelect),
        const Spacer(),
        const Divider(color: Color(0xFF262930)),
        const Padding(
          padding: EdgeInsets.fromLTRB(12, 8, 8, 0),
          child: Text(
            'Browse the Yangon TV collection',
            style: TextStyle(color: _muted, fontSize: 12, height: 1.45),
          ),
        ),
      ],
    ),
  );
}

class _NavTile extends StatelessWidget {
  const _NavTile({
    required this.item,
    required this.selected,
    required this.onSelect,
  });

  final _Section item;
  final bool selected;
  final ValueChanged<_Section> onSelect;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 5),
    child: Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: selected ? const Color(0xFF31181B) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          key: ValueKey('nav-${item.name}'),
          borderRadius: BorderRadius.circular(12),
          onTap: () => onSelect(item),
          child: SizedBox(
            height: 46,
            child: Row(
              children: [
                Container(
                  width: 3,
                  height: 24,
                  decoration: BoxDecoration(
                    color: selected ? _red : Colors.transparent,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: 12),
                Icon(item.icon, size: 19, color: selected ? _gold : _muted),
                const SizedBox(width: 12),
                Text(
                  item.title,
                  style: TextStyle(
                    color: selected ? Colors.white : const Color(0xFFCDD0D5),
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.title, this.onBack});

  final String title;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) => Container(
    height: 68,
    padding: const EdgeInsets.symmetric(horizontal: 30),
    decoration: const BoxDecoration(
      border: Border(bottom: BorderSide(color: Color(0xFF22252A))),
    ),
    child: Row(
      children: [
        if (onBack != null) ...[
          IconButton(
            tooltip: 'Back to browse',
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
        ),
        const Text(
          'YGNTV',
          style: TextStyle(color: _muted, fontSize: 12, letterSpacing: 1.2),
        ),
      ],
    ),
  );
}

class _HomePage extends StatefulWidget {
  const _HomePage({
    required this.service,
    required this.onOpen,
    required this.onOpenBlog,
    required this.onExplore,
  });

  final AuthService service;
  final ValueChanged<CatalogItem> onOpen;
  final ValueChanged<TvBlogPost> onOpenBlog;
  final VoidCallback onExplore;

  @override
  State<_HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<_HomePage> {
  late Future<_HomeData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_HomeData> _load() async {
    final results = await Future.wait<Object>([
      widget.service.getTopAdBanners().catchError(
        (_) => const <TvHomeBanner>[],
      ),
      widget.service.loadCatalog('movie', perPage: 10),
      widget.service.loadCatalog('series', perPage: 10),
      widget.service.getBlogPosts().catchError((_) => const <TvBlogPost>[]),
    ]);
    return _HomeData(
      banners: results[0] as List<TvHomeBanner>,
      movies: results[1] as List<CatalogItem>,
      series: results[2] as List<CatalogItem>,
      blogs: results[3] as List<TvBlogPost>,
    );
  }

  void _retry() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) => FutureBuilder<_HomeData>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const _LoadingPane();
      }
      if (snapshot.hasError) {
        return _ErrorPane(
          message: _friendlyError(snapshot.error),
          onRetry: _retry,
        );
      }
      final data = snapshot.data!;
      return _PageScroll(
        children: [
          if (data.banners.isNotEmpty) ...[
            _SectionHeading(title: 'Featured', subtitle: 'From Yangon TV'),
            _BannerStrip(banners: data.banners),
            const SizedBox(height: 28),
          ],
          _WelcomePanel(onExplore: widget.onExplore),
          const SizedBox(height: 34),
          _ContentShelf(
            title: 'Movies',
            subtitle: 'Stories for every mood',
            items: data.movies,
            onOpen: widget.onOpen,
          ),
          const SizedBox(height: 32),
          _ContentShelf(
            title: 'Series',
            subtitle: 'Follow a story episode by episode',
            items: data.series,
            onOpen: widget.onOpen,
          ),
          if (data.blogs.isNotEmpty) ...[
            const SizedBox(height: 32),
            _BlogShelf(
              posts: data.blogs.take(3).toList(),
              onOpen: widget.onOpenBlog,
            ),
          ],
        ],
      );
    },
  );
}

class _HomeData {
  const _HomeData({
    required this.banners,
    required this.movies,
    required this.series,
    required this.blogs,
  });
  final List<TvHomeBanner> banners;
  final List<CatalogItem> movies;
  final List<CatalogItem> series;
  final List<TvBlogPost> blogs;
}

class _WelcomePanel extends StatelessWidget {
  const _WelcomePanel({required this.onExplore});
  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) => Container(
    height: 300,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      gradient: const LinearGradient(
        colors: [Color(0xFF321719), Color(0xFF171113), Color(0xFF111317)],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ),
      border: Border.all(color: _red.withValues(alpha: .26)),
    ),
    child: Stack(
      children: [
        Positioned(
          right: 24,
          top: 0,
          bottom: 0,
          child: Icon(
            Icons.local_movies_rounded,
            size: 230,
            color: Colors.white.withValues(alpha: .04),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(26),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'MADE FOR MYANMAR AUDIENCES',
                  style: TextStyle(
                    color: _gold,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Stories worth staying up for.',
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Explore movies and series from Yangon TV.',
                  style: TextStyle(color: _muted, fontSize: 15),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: onExplore,
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Explore collection'),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _BannerStrip extends StatelessWidget {
  const _BannerStrip({required this.banners});
  final List<TvHomeBanner> banners;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 94,
    child: ListView.separated(
      scrollDirection: Axis.horizontal,
      itemCount: banners.length,
      separatorBuilder: (_, _) => const SizedBox(width: 12),
      itemBuilder: (context, index) {
        final banner = banners[index];
        return SizedBox(
          width: 760,
          child: AspectRatio(
            aspectRatio: 728 / 90,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: banner.linkUrl == null
                  ? null
                  : () => _launchHttps(banner.linkUrl!),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  banner.imageUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => _ImageFallback(label: banner.name),
                ),
              ),
            ),
          ),
        );
      },
    ),
  );
}

class _CatalogPage extends StatefulWidget {
  const _CatalogPage({
    super.key,
    required this.service,
    required this.kind,
    required this.onOpen,
  });
  final AuthService service;
  final String kind;
  final ValueChanged<CatalogItem> onOpen;

  @override
  State<_CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends State<_CatalogPage> {
  late Future<List<CatalogItem>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.service.loadCatalog(widget.kind, perPage: 48);
  }

  void _retry() => setState(
    () => _future = widget.service.loadCatalog(widget.kind, perPage: 48),
  );

  @override
  Widget build(BuildContext context) => FutureBuilder<List<CatalogItem>>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const _LoadingPane();
      }
      if (snapshot.hasError) {
        return _ErrorPane(
          message: _friendlyError(snapshot.error),
          onRetry: _retry,
        );
      }
      return _PageScroll(
        children: [
          _SectionHeading(
            title: widget.kind == 'movie' ? 'Movies' : 'Series',
            subtitle: '${snapshot.data!.length} titles',
          ),
          _CatalogGrid(items: snapshot.data!, onOpen: widget.onOpen),
        ],
      );
    },
  );
}

class _SearchPage extends StatefulWidget {
  const _SearchPage({required this.service, required this.onOpen});
  final AuthService service;
  final ValueChanged<CatalogItem> onOpen;

  @override
  State<_SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<_SearchPage> {
  final _controller = TextEditingController();
  List<CatalogItem> _results = const [];
  bool _loading = false;
  String? _error;
  bool _searched = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _controller.text.trim();
    if (query.isEmpty) {
      setState(() {
        _results = const [];
        _searched = false;
        _error = null;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _searched = true;
    });
    try {
      final results = await widget.service.searchCatalog(query);
      if (!mounted) return;
      setState(() => _results = results);
    } catch (error) {
      if (mounted) setState(() => _error = _friendlyError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => _PageScroll(
    children: [
      const _SectionHeading(
        title: 'Search',
        subtitle: 'Find movies and series',
      ),
      Row(
        children: [
          Expanded(
            child: TextField(
              key: const ValueKey('catalog-search-field'),
              controller: _controller,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _search(),
              decoration: const InputDecoration(
                hintText: 'Search titles',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
          ),
          const SizedBox(width: 10),
          FilledButton.icon(
            key: const ValueKey('catalog-search-button'),
            onPressed: _loading ? null : _search,
            icon: const Icon(Icons.search_rounded),
            label: const Text('Search'),
          ),
        ],
      ),
      const SizedBox(height: 24),
      if (_loading) const LinearProgressIndicator(minHeight: 2),
      if (_error != null) _InlineError(message: _error!, onRetry: _search),
      if (!_loading && _error == null && _searched && _results.isEmpty)
        const _EmptyPane(
          title: 'No results',
          message: 'Try another title or spelling.',
        ),
      if (_results.isNotEmpty)
        _CatalogGrid(items: _results, onOpen: widget.onOpen),
    ],
  );
}

class _BlogPage extends StatefulWidget {
  const _BlogPage({required this.service, required this.onOpen});
  final AuthService service;
  final ValueChanged<TvBlogPost> onOpen;

  @override
  State<_BlogPage> createState() => _BlogPageState();
}

class _BlogPageState extends State<_BlogPage> {
  late Future<List<TvBlogPost>> _future;
  @override
  void initState() {
    super.initState();
    _future = widget.service.getBlogPosts();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<TvBlogPost>>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const _LoadingPane();
      }
      if (snapshot.hasError) {
        return _ErrorPane(
          message: _friendlyError(snapshot.error),
          onRetry: () =>
              setState(() => _future = widget.service.getBlogPosts()),
        );
      }
      final posts = snapshot.data!;
      return _PageScroll(
        children: [
          const _SectionHeading(
            title: 'Blog',
            subtitle: 'Stories, news and watch guides',
          ),
          if (posts.isEmpty)
            const _EmptyPane(
              title: 'No stories yet',
              message: 'New Yangon TV stories will appear here.',
            ),
          _BlogGrid(posts: posts, onOpen: widget.onOpen),
        ],
      );
    },
  );
}

class _DetailPage extends StatefulWidget {
  const _DetailPage({super.key, required this.service, required this.item});
  final AuthService service;
  final CatalogItem item;

  @override
  State<_DetailPage> createState() => _DetailPageState();
}

class _DetailPageState extends State<_DetailPage>
    with SingleTickerProviderStateMixin {
  late Future<CatalogItem> _future;
  late TabController _tabs;
  int? _selectedSeasonNumber;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _future = widget.service.loadDetail(widget.item);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<CatalogItem>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const _LoadingPane();
      }
      if (snapshot.hasError) {
        return _ErrorPane(
          message: _friendlyError(snapshot.error),
          onRetry: () =>
              setState(() => _future = widget.service.loadDetail(widget.item)),
        );
      }
      final item = snapshot.data!;
      return _PageScroll(
        children: [
          _DetailHero(item: item),
          const SizedBox(height: 22),
          TabBar(
            controller: _tabs,
            isScrollable: true,
            tabs: const [
              Tab(text: 'Review'),
              Tab(text: 'Watch'),
              Tab(text: 'Download'),
            ],
          ),
          const SizedBox(height: 20),
          AnimatedBuilder(
            animation: _tabs,
            builder: (context, _) => switch (_tabs.index) {
              0 => _ReviewPanel(item: item),
              1 => _WatchPanel(
                item: item,
                selectedSeasonNumber: _selectedSeasonNumber,
                onSeasonChanged: (number) =>
                    setState(() => _selectedSeasonNumber = number),
              ),
              _ => _DownloadPanel(
                item: item,
                selectedSeasonNumber: _selectedSeasonNumber,
                onSeasonChanged: (number) =>
                    setState(() => _selectedSeasonNumber = number),
              ),
            },
          ),
        ],
      );
    },
  );
}

class _DetailHero extends StatelessWidget {
  const _DetailHero({required this.item});
  final CatalogItem item;

  @override
  Widget build(BuildContext context) => Container(
    constraints: const BoxConstraints(minHeight: 260),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(20),
      gradient: const LinearGradient(
        colors: [Color(0xFF221416), _panel, _panel],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ),
      border: Border.all(color: Colors.white.withValues(alpha: .06)),
    ),
    padding: const EdgeInsets.all(24),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 152,
          height: 218,
          child: _Poster(url: item.posterUrl, label: item.title),
        ),
        const SizedBox(width: 26),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _Pill(item.kind == 'movie' ? 'MOVIE' : 'SERIES', color: _red),
                  if (item.year.isNotEmpty) _Pill(item.year),
                  if (item.rating > 0)
                    _Pill('★ ${item.rating.toStringAsFixed(1)}', color: _gold),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                item.title,
                style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 12),
              if (item.genres.isNotEmpty)
                Text(
                  item.genres.join('  •  '),
                  style: const TextStyle(color: _muted),
                ),
              if (item.synopsis.isNotEmpty) ...[
                const SizedBox(height: 18),
                Text(
                  item.synopsis,
                  maxLines: 5,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Color(0xFFD1D3D7), height: 1.5),
                ),
              ],
            ],
          ),
        ),
      ],
    ),
  );
}

class _ReviewPanel extends StatelessWidget {
  const _ReviewPanel({required this.item});
  final CatalogItem item;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Review',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Text(
            item.synopsis.isEmpty
                ? 'No review is available yet.'
                : item.synopsis,
            style: const TextStyle(color: Color(0xFFD1D3D7), height: 1.65),
          ),
          if (item.kind == 'series' && item.seasons.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              '${item.seasons.length} ${item.seasons.length == 1 ? 'season' : 'seasons'}',
              style: const TextStyle(color: _gold, fontWeight: FontWeight.w700),
            ),
          ],
        ],
      ),
    ),
  );
}

class _WatchPanel extends StatelessWidget {
  const _WatchPanel({
    required this.item,
    required this.selectedSeasonNumber,
    required this.onSeasonChanged,
  });
  final CatalogItem item;
  final int? selectedSeasonNumber;
  final ValueChanged<int?> onSeasonChanged;

  @override
  Widget build(BuildContext context) => _EpisodeActionPanel(
    item: item,
    selectedSeasonNumber: selectedSeasonNumber,
    onSeasonChanged: onSeasonChanged,
    actionLabel: 'Open Watch link',
    actionIcon: Icons.play_circle_fill_rounded,
    onActivate: launchTelegramWatch,
    kind: 'watch',
  );
}

class _DownloadPanel extends StatelessWidget {
  const _DownloadPanel({
    required this.item,
    required this.selectedSeasonNumber,
    required this.onSeasonChanged,
  });
  final CatalogItem item;
  final int? selectedSeasonNumber;
  final ValueChanged<int?> onSeasonChanged;

  @override
  Widget build(BuildContext context) => const Card(
    child: Padding(
      padding: EdgeInsets.all(22),
      child: Row(
        children: [
          Icon(Icons.download_rounded, color: _muted, size: 28),
          SizedBox(width: 14),
          Expanded(
            child: Text(
              'Downloads are unavailable in this desktop preview.',
              style: TextStyle(color: Color(0xFFD1D3D7)),
            ),
          ),
        ],
      ),
    ),
  );
}

class _EpisodeActionPanel extends StatelessWidget {
  const _EpisodeActionPanel({
    required this.item,
    required this.selectedSeasonNumber,
    required this.onSeasonChanged,
    required this.actionLabel,
    required this.actionIcon,
    required this.onActivate,
    required this.kind,
  });
  final CatalogItem item;
  final int? selectedSeasonNumber;
  final ValueChanged<int?> onSeasonChanged;
  final String actionLabel;
  final IconData actionIcon;
  final Future<bool> Function(String?) onActivate;
  final String kind;

  @override
  Widget build(BuildContext context) {
    if (item.kind != 'series' || item.seasons.isEmpty) {
      return _OpenLinkCard(
        url: item.telegramPostUrl,
        label: actionLabel,
        icon: actionIcon,
        onActivate: onActivate,
      );
    }
    final seasons = [...item.seasons]
      ..sort((a, b) => a.number.compareTo(b.number));
    final current =
        seasons
            .where((season) => season.number == selectedSeasonNumber)
            .firstOrNull ??
        seasons.first;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              kind == 'watch'
                  ? 'Episode Guide · Watch'
                  : 'Episode Guide · Download',
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            if (seasons.length > 1) ...[
              const Text(
                'Season',
                style: TextStyle(color: _muted, fontSize: 12),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<int?>(
                key: ValueKey('season-${item.id}-$selectedSeasonNumber'),
                initialValue: current.number,
                items: [
                  for (final season in seasons)
                    DropdownMenuItem(
                      value: season.number,
                      child: Text(
                        season.title.isNotEmpty
                            ? season.title
                            : 'Season ${season.number}',
                      ),
                    ),
                ],
                onChanged: onSeasonChanged,
              ),
              const SizedBox(height: 12),
            ],
            if (current.episodes.isEmpty)
              const _EmptyPane(
                title: 'No episodes listed',
                message: 'Episode information is not available yet.',
              ),
            for (final episode in current.episodes)
              _EpisodeRow(
                episode: episode,
                actionLabel: actionLabel,
                actionIcon: actionIcon,
                onActivate: onActivate,
              ),
          ],
        ),
      ),
    );
  }
}

class _EpisodeRow extends StatelessWidget {
  const _EpisodeRow({
    required this.episode,
    required this.actionLabel,
    required this.actionIcon,
    required this.onActivate,
  });
  final CatalogEpisode episode;
  final String actionLabel;
  final IconData actionIcon;
  final Future<bool> Function(String?) onActivate;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: SizedBox(
      width: 84,
      height: 64,
      child: _Poster(url: episode.thumbnailUrl, label: episode.title),
    ),
    title: Text(
      'Episode ${episode.number} · ${episode.title}',
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    ),
    subtitle: episode.duration.isEmpty
        ? null
        : Text(episode.duration, style: const TextStyle(color: _muted)),
    trailing: IconButton(
      tooltip: episode.telegramPostUrl == null
          ? 'Link unavailable'
          : actionLabel,
      onPressed: episode.telegramPostUrl == null
          ? null
          : () => onActivate(episode.telegramPostUrl),
      icon: Icon(
        actionIcon,
        color: episode.telegramPostUrl == null ? _muted : _gold,
      ),
    ),
  );
}

class _OpenLinkCard extends StatelessWidget {
  const _OpenLinkCard({
    required this.url,
    required this.label,
    required this.icon,
    required this.onActivate,
  });
  final String? url;
  final String label;
  final IconData icon;
  final Future<bool> Function(String?) onActivate;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(22),
      child: Row(
        children: [
          Icon(icon, color: _gold, size: 30),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              url == null
                  ? 'A Telegram link is not available for this title yet.'
                  : 'Open the official YGNTV post in Telegram or your browser.',
              style: const TextStyle(color: Color(0xFFD1D3D7)),
            ),
          ),
          const SizedBox(width: 16),
          FilledButton.icon(
            onPressed: url == null ? null : () => onActivate(url),
            icon: Icon(icon),
            label: Text(label),
          ),
        ],
      ),
    ),
  );
}

class _BlogDetailPage extends StatefulWidget {
  const _BlogDetailPage({super.key, required this.service, required this.post});
  final AuthService service;
  final TvBlogPost post;
  @override
  State<_BlogDetailPage> createState() => _BlogDetailPageState();
}

class _BlogDetailPageState extends State<_BlogDetailPage> {
  late Future<TvBlogPost> _future;
  @override
  void initState() {
    super.initState();
    _future = widget.service.getBlogPost(widget.post.slug);
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<TvBlogPost>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const _LoadingPane();
      }
      if (snapshot.hasError) {
        return _ErrorPane(
          message: _friendlyError(snapshot.error),
          onRetry: () => setState(
            () => _future = widget.service.getBlogPost(widget.post.slug),
          ),
        );
      }
      final post = snapshot.data!;
      return _PageScroll(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: _Poster(url: post.image, label: post.title),
            ),
          ),
          const SizedBox(height: 22),
          if (post.category.isNotEmpty) _Pill(post.category, color: _gold),
          const SizedBox(height: 12),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 980),
            child: Text(
              post.title,
              style: const TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            [
              post.author,
              post.date,
            ].where((value) => value.isNotEmpty).join('  •  '),
            style: const TextStyle(color: _muted),
          ),
          if (post.excerpt.isNotEmpty) ...[
            const SizedBox(height: 22),
            Text(
              post.excerpt,
              style: const TextStyle(color: _gold, fontSize: 17, height: 1.55),
            ),
          ],
          if (_plainText(post.content).isNotEmpty) ...[
            const SizedBox(height: 18),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 980),
              child: SelectableText(
                _plainText(post.content),
                style: const TextStyle(
                  color: Color(0xFFD1D3D7),
                  height: 1.75,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ],
      );
    },
  );
}

class _BlogShelf extends StatelessWidget {
  const _BlogShelf({required this.posts, required this.onOpen});
  final List<TvBlogPost> posts;
  final ValueChanged<TvBlogPost> onOpen;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const _SectionHeading(
        title: 'From the Blog',
        subtitle: 'Stories and watch guides',
      ),
      _BlogGrid(posts: posts, onOpen: onOpen, maxItems: 3),
    ],
  );
}

class _BlogGrid extends StatelessWidget {
  const _BlogGrid({required this.posts, required this.onOpen, this.maxItems});
  final List<TvBlogPost> posts;
  final ValueChanged<TvBlogPost> onOpen;
  final int? maxItems;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final columns = _columnsFor(constraints.maxWidth);
      final shown = maxItems == null ? posts : posts.take(maxItems!).toList();
      return GridView.builder(
        key: const ValueKey('blog-grid'),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: shown.length,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: columns,
          crossAxisSpacing: 18,
          mainAxisSpacing: 18,
          childAspectRatio: 1.25,
        ),
        itemBuilder: (context, index) =>
            _BlogCard(post: shown[index], onTap: () => onOpen(shown[index])),
      );
    },
  );
}

class _BlogCard extends StatelessWidget {
  const _BlogCard({required this.post, required this.onTap});
  final TvBlogPost post;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      key: ValueKey('blog-${post.slug}'),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: SizedBox(
                width: double.infinity,
                child: _Poster(url: post.image, label: post.title),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (post.excerpt.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    post.excerpt,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: _muted, fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _CatalogGrid extends StatelessWidget {
  const _CatalogGrid({required this.items, required this.onOpen});
  final List<CatalogItem> items;
  final ValueChanged<CatalogItem> onOpen;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      if (items.isEmpty) {
        return const _EmptyPane(
          title: 'Nothing to show yet',
          message: 'New Yangon TV titles will appear here.',
        );
      }
      final columns = _columnsFor(constraints.maxWidth);
      return GridView.builder(
        key: const ValueKey('catalog-grid'),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: items.length,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: columns,
          crossAxisSpacing: 18,
          mainAxisSpacing: 20,
          childAspectRatio: .62,
        ),
        itemBuilder: (context, index) =>
            _CatalogCard(item: items[index], onTap: () => onOpen(items[index])),
      );
    },
  );
}

int _columnsFor(double width) => width >= 1200
    ? 6
    : width >= 850
    ? 5
    : width >= 620
    ? 4
    : width >= 400
    ? 3
    : 2;

class _ContentShelf extends StatelessWidget {
  const _ContentShelf({
    required this.title,
    required this.subtitle,
    required this.items,
    required this.onOpen,
  });
  final String title;
  final String subtitle;
  final List<CatalogItem> items;
  final ValueChanged<CatalogItem> onOpen;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _SectionHeading(title: title, subtitle: subtitle),
      if (items.isEmpty)
        const _EmptyPane(
          title: 'Nothing to show yet',
          message: 'New titles will appear here.',
        ),
      if (items.isNotEmpty)
        SizedBox(
          height: 300,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: items.take(10).length,
            separatorBuilder: (_, _) => const SizedBox(width: 16),
            itemBuilder: (context, index) => SizedBox(
              width: 172,
              child: _CatalogCard(
                item: items[index],
                onTap: () => onOpen(items[index]),
              ),
            ),
          ),
        ),
    ],
  );
}

class _CatalogCard extends StatelessWidget {
  const _CatalogCard({required this.item, required this.onTap});
  final CatalogItem item;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      key: ValueKey('title-${item.id ?? item.slug}-${item.kind}'),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                _Poster(url: item.posterUrl, label: item.title),
                Positioned(
                  left: 8,
                  top: 8,
                  child: _Pill(
                    item.kind == 'movie' ? 'MOVIE' : 'SERIES',
                    color: _red,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(11, 9, 11, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
                if (item.year.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    item.year,
                    style: const TextStyle(color: _muted, fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _Poster extends StatelessWidget {
  const _Poster({required this.url, required this.label});
  final String url;
  final String label;
  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) return _ImageFallback(label: label);
    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => _ImageFallback(label: label),
      frameBuilder: (context, child, frame, wasSynchronouslyLoaded) =>
          frame == null && !wasSynchronouslyLoaded
          ? const _ImageFallback(label: 'Loading image')
          : child,
    );
  }
}

class _ImageFallback extends StatelessWidget {
  const _ImageFallback({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Container(
    color: _panelRaised,
    alignment: Alignment.center,
    child: LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxHeight < 68 || constraints.maxWidth < 92;
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.movie_filter_rounded,
              color: const Color(0xFF686E78),
              size: compact ? 20 : 30,
            ),
            if (!compact && label != 'Loading image') ...[
              const SizedBox(height: 5),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  label,
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: _muted, fontSize: 10),
                ),
              ),
            ],
          ],
        );
      },
    ),
  );
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title, required this.subtitle});
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 18),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(color: _muted, fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _Pill extends StatelessWidget {
  const _Pill(this.label, {this.color = _muted});
  final String label;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .14),
      borderRadius: BorderRadius.circular(99),
      border: Border.all(color: color.withValues(alpha: .3)),
    ),
    child: Text(
      label,
      style: TextStyle(
        color: color,
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: .45,
      ),
    ),
  );
}

class _PageScroll extends StatelessWidget {
  const _PageScroll({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Scrollbar(
    child: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(30, 26, 30, 44),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1440),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: children,
          ),
        ),
      ),
    ),
  );
}

class _LoadingPane extends StatelessWidget {
  const _LoadingPane();
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: _red));
}

class _EmptyPane extends StatelessWidget {
  const _EmptyPane({required this.title, required this.message});
  final String title;
  final String message;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(20),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.movie_outlined, color: _muted, size: 30),
        const SizedBox(height: 8),
        Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: _muted),
        ),
      ],
    ),
  );
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(child: Text(message)),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    ),
  );
}

class _ErrorPane extends StatelessWidget {
  const _ErrorPane({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 480),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, color: _red, size: 42),
            const SizedBox(height: 14),
            const Text(
              'Could not load this page',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: _muted),
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    ),
  );
}

String _friendlyError(Object? error) {
  if (error is AuthException) return error.message;
  return 'Check your internet connection and try again.';
}

String _plainText(String value) => value
    .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
    .replaceAll(RegExp(r'</(p|h[1-6]|li|div)>', caseSensitive: false), '\n\n')
    .replaceAll(RegExp(r'<[^>]*>'), '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();

Future<void> _launchHttps(String value) async {
  final uri = Uri.tryParse(value);
  if (uri == null || uri.scheme != 'https' || uri.host.isEmpty) return;
  try {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    // A missing system browser should not crash the catalog UI.
  }
}
