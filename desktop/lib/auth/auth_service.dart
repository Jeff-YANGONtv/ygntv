import 'dart:convert';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:uuid/uuid.dart';

import 'local_notification_store.dart';
import 'support_models.dart';

const _apiHost = 'api.ygntv.org';
const _apiBase = 'https://api.ygntv.org/api';
const _webOrigin = 'https://ygntv.org';
const _mobileReturnUri = 'yangontv://oauth/complete';
const _callbackScheme = 'yangontv';
const _downloadChannel = MethodChannel('org.ygntv.customer/download');
const _videoQualities = <String>{
  '360p',
  '480p',
  '720p',
  '1080p',
  '1440p',
  '2160p',
  'source',
};
const _storage = FlutterSecureStorage(aOptions: AndroidOptions());

class AuthSession {
  const AuthSession({
    required this.token,
    required this.userId,
    required this.name,
    required this.email,
  });

  final String token;
  final String userId;
  final String name;
  final String email;

  Map<String, Object?> toJson() => {
    'user_id': userId,
    'name': name,
    'email': email,
  };

  factory AuthSession.fromStored({
    required String token,
    required String json,
  }) {
    final value = jsonDecode(json) as Map<String, dynamic>;
    return AuthSession(
      token: token,
      userId: '${value['user_id'] ?? ''}',
      name: '${value['name'] ?? 'Yangon TV viewer'}',
      email: '${value['email'] ?? ''}',
    );
  }
}

class CatalogItem {
  const CatalogItem({
    required this.title,
    required this.posterUrl,
    required this.kind,
    this.id,
    this.slug = '',
    this.year = '',
    this.synopsis = '',
    this.backdropUrl = '',
    this.rating = 0,
    this.genres = const [],
    this.seasons = const [],
    this.telegramPostUrl,
  });

  final int? id;
  final String slug;
  final String title;
  final String posterUrl;
  final String backdropUrl;
  final String kind;
  final String year;
  final String synopsis;
  final double rating;
  final List<String> genres;
  final List<CatalogSeason> seasons;
  final String? telegramPostUrl;

  factory CatalogItem.fromJson(Map<String, dynamic> json, String kind) {
    final title = _firstString(json, ['title', 'name'], fallback: 'Untitled');
    final poster = _posterFromJson(json);
    final release = _firstString(json, ['release_date', 'year']);
    final seasonsValue = json['seasons'];
    final seasons = seasonsValue is List
        ? seasonsValue
              .whereType<Map>()
              .map(
                (row) => CatalogSeason.fromJson(Map<String, dynamic>.from(row)),
              )
              .toList(growable: false)
        : const <CatalogSeason>[];
    return CatalogItem(
      id: _intValue(json['id'] ?? json['content_id']),
      slug: _firstString(json, ['slug']),
      title: title,
      posterUrl: _mediaUrl(poster),
      backdropUrl: _mediaUrl(_backdropFromJson(json)),
      kind: kind,
      year: release.length >= 4 ? release.substring(0, 4) : release,
      synopsis: _firstString(json, ['synopsis', 'review', 'description']),
      rating: _doubleValue(json['rating']),
      genres: _stringList(json['genres']),
      seasons: seasons,
      telegramPostUrl: _nullableString(
        json['telegram_post_url'] ?? json['telegramPostUrl'],
      ),
    );
  }
}

class CatalogSeason {
  const CatalogSeason({
    required this.id,
    required this.number,
    required this.title,
    required this.episodes,
    this.year = '',
    this.review = '',
  });

  final int? id;
  final int number;
  final String title;
  final String year;
  final String review;
  final List<CatalogEpisode> episodes;

  factory CatalogSeason.fromJson(Map<String, dynamic> json) {
    final episodesValue = json['episodes'];
    final episodes = episodesValue is List
        ? episodesValue
              .whereType<Map>()
              .toList(growable: false)
              .asMap()
              .entries
              .map(
                (entry) => CatalogEpisode.fromJson(
                  Map<String, dynamic>.from(entry.value),
                  entry.key + 1,
                ),
              )
              .toList(growable: false)
        : const <CatalogEpisode>[];
    final title = _firstString(json, ['title', 'name'], fallback: 'Season');
    return CatalogSeason(
      id: _intValue(json['id']),
      number:
          _intValue(json['season_number'] ?? json['number']) ??
          _numberFromTitle(title) ??
          1,
      title: title,
      year: _firstString(json, ['year']),
      review: _firstString(json, ['review', 'description']),
      episodes: episodes,
    );
  }
}

class CatalogEpisode {
  const CatalogEpisode({
    required this.id,
    required this.number,
    required this.title,
    this.duration = '',
    this.thumbnailUrl = '',
    this.review = '',
    this.available = true,
    this.telegramPostUrl,
  });

  final int? id;
  final int number;
  final String title;
  final String duration;
  final String thumbnailUrl;
  final String review;
  final bool available;
  final String? telegramPostUrl;

  factory CatalogEpisode.fromJson(Map<String, dynamic> json, int index) {
    final title = _firstString(json, [
      'title',
      'name',
    ], fallback: 'Episode $index');
    final availableValue = json['available'] ?? json['is_available'];
    return CatalogEpisode(
      id: _intValue(json['id']),
      number:
          _intValue(json['episode_number'] ?? json['number']) ??
          _numberFromTitle(title) ??
          index,
      title: title,
      duration: _firstString(json, ['duration', 'runtime']),
      thumbnailUrl: _mediaUrl(_posterFromJson(json)),
      review: _firstString(json, ['review', 'description']),
      available: availableValue is bool ? availableValue : true,
      telegramPostUrl: _nullableString(
        json['telegram_post_url'] ?? json['telegramPostUrl'],
      ),
    );
  }
}

class TvPlaybackSource {
  const TvPlaybackSource({
    required this.provider,
    required this.qualities,
    required this.streamingLinks,
    required this.downloadLinks,
  });

  final String provider;
  final List<String> qualities;
  final List<String> streamingLinks;
  final List<String> downloadLinks;

  String get label =>
      provider == 'r2' ? 'Server 1 · R2' : 'Server 2 · Telegram MTProto';

  static TvPlaybackSource? tryParse(Map<String, dynamic> json) {
    final provider = _firstString(json, ['provider']);
    if (!{'r2', 'telegram_mtproto'}.contains(provider)) return null;
    final streams = _stringList(json['streaming_links'])
        .where((url) => _isProtectedServerUrl(url, provider))
        .toList(growable: false);
    final downloads = _stringList(json['download_links'])
        .where((url) => _isProtectedServerUrl(url, provider, download: true))
        .toList(growable: false);
    if (streams.isEmpty) return null;
    final qualities = _stringList(json['qualities'])
        .where((quality) => _videoQualities.contains(quality))
        .toList(growable: false);
    return TvPlaybackSource(
      provider: provider,
      qualities: qualities,
      streamingLinks: streams,
      downloadLinks: downloads,
    );
  }
}

class TvPlaybackPayload {
  const TvPlaybackPayload({
    required this.contentType,
    required this.contentId,
    required this.title,
    required this.access,
    required this.playbackCookie,
    this.watchSessionKey,
    this.remainingWatchSeconds = 0,
    this.serverSources = const [],
    this.managedAssets = false,
  });

  final String contentType;
  final int contentId;
  final String title;
  final String access;
  final String playbackCookie;
  final String? watchSessionKey;
  final int remainingWatchSeconds;
  final List<TvPlaybackSource> serverSources;
  final bool managedAssets;

  factory TvPlaybackPayload.fromJson(
    Map<String, dynamic> json, {
    String playbackCookie = '',
  }) {
    final accessValue = json['access'];
    final access = accessValue is Map
        ? '${accessValue['access'] ?? ''}'
        : '${accessValue ?? ''}';
    final rawWatchKey = accessValue is Map
        ? accessValue['watch_session_key']?.toString()
        : null;
    return TvPlaybackPayload(
      contentType: _firstString(json, ['content_type'], fallback: 'movie'),
      contentId: _intValue(json['content_id']) ?? 0,
      title: _firstString(json, ['title'], fallback: 'Yangon TV'),
      access: access,
      playbackCookie: playbackCookie,
      watchSessionKey: rawWatchKey == null || rawWatchKey.isEmpty
          ? null
          : rawWatchKey,
      remainingWatchSeconds: accessValue is Map
          ? _intValue(accessValue['remaining_seconds']) ?? 0
          : 0,
      serverSources: _playbackSources(json['server_sources']),
      managedAssets: json['managed_assets'] == true,
    );
  }
}

class DownloadTarget {
  const DownloadTarget({
    required this.url,
    required this.headers,
    required this.fileName,
  });

  final String url;
  final Map<String, String> headers;
  final String fileName;
}

class TvDownloadProgress {
  const TvDownloadProgress({
    required this.id,
    required this.title,
    required this.status,
    required this.bytesDownloaded,
    required this.totalBytes,
    this.message,
    this.localUri,
  });

  final int id;
  final String title;
  final String status;
  final int bytesDownloaded;
  final int totalBytes;
  final String? message;
  final String? localUri;

  String? get localFilePath {
    final uri = localUri == null ? null : Uri.tryParse(localUri!);
    if (uri == null || uri.scheme != 'file') return null;
    return uri.toFilePath();
  }

  double? get progress {
    if (totalBytes <= 0) return null;
    return (bytesDownloaded / totalBytes).clamp(0.0, 1.0).toDouble();
  }

  bool get isActive =>
      status == 'pending' || status == 'downloading' || status == 'paused';

  String get statusLabel => switch (status) {
    'pending' => 'Waiting to download',
    'downloading' => 'Downloading',
    'paused' => 'Download paused',
    'complete' => 'Download complete',
    'failed' => 'Download failed',
    _ => 'Download status unavailable',
  };

  factory TvDownloadProgress.fromMap(Map<String, dynamic> map) =>
      TvDownloadProgress(
        id: _intValue(map['id']) ?? 0,
        title: _firstString(map, ['title'], fallback: 'YGNTV video'),
        status: _firstString(map, ['status'], fallback: 'pending'),
        bytesDownloaded:
            _intValue(map['bytes_downloaded'] ?? map['bytesDownloaded']) ?? 0,
        totalBytes: _intValue(map['total_bytes'] ?? map['totalBytes']) ?? 0,
        message: _nullableString(map['message']),
        localUri: _nullableString(map['local_uri'] ?? map['localUri']),
      );
}

class TvPremiumPlan {
  const TvPremiumPlan({
    required this.key,
    required this.label,
    required this.amountKs,
    required this.accessMonths,
  });

  final String key;
  final String label;
  final int amountKs;
  final int accessMonths;

  factory TvPremiumPlan.fromJson(Map<String, dynamic> json) => TvPremiumPlan(
    key: '${json['key'] ?? ''}',
    label: _firstString(json, ['label', 'name'], fallback: 'Premium'),
    amountKs: _intValue(json['amount_ks'] ?? json['amount']) ?? 0,
    accessMonths: _intValue(json['access_months'] ?? json['months']) ?? 0,
  );
}

class TvDevice {
  const TvDevice({
    required this.id,
    required this.name,
    required this.platform,
    required this.appVersion,
    required this.lastSeenAt,
  });

  final int id;
  final String name;
  final String platform;
  final String appVersion;
  final String lastSeenAt;

  factory TvDevice.fromJson(Map<String, dynamic> json) => TvDevice(
    id: _intValue(json['id']) ?? 0,
    name: _firstString(json, ['device_name'], fallback: 'Device'),
    platform: _firstString(json, ['platform']),
    appVersion: _firstString(json, ['app_version']),
    lastSeenAt: _firstString(json, ['last_seen_at']),
  );
}

class TvEntitlement {
  const TvEntitlement({
    required this.active,
    required this.planKey,
    required this.planLabel,
    required this.validFrom,
    required this.validUntil,
  });

  final bool active;
  final String? planKey;
  final String? planLabel;
  final String? validFrom;
  final String? validUntil;

  factory TvEntitlement.fromJson(Map<String, dynamic> json) => TvEntitlement(
    active: json['active'] == true,
    planKey: _nullableString(json['plan_key']),
    planLabel: _nullableString(json['plan_label']),
    validFrom: _nullableString(json['valid_from']),
    validUntil: _nullableString(json['valid_until']),
  );
}

class TvProfileData {
  const TvProfileData({
    required this.name,
    required this.email,
    required this.displayName,
    required this.entitlement,
    required this.devices,
    this.screenTimeLast30DaysSeconds = 0,
    this.deviceLimit = 2,
  });

  final String name;
  final String email;
  final String displayName;
  final TvEntitlement entitlement;
  final List<TvDevice> devices;
  final int screenTimeLast30DaysSeconds;
  final int deviceLimit;

  factory TvProfileData.fromJson(Map<String, dynamic> json) {
    final user = _asMap(json['user']);
    final profile = _asMap(json['profile']);
    final entitlement = _asMap(json['entitlement']);
    final devicesValue = json['devices'];
    final screenTime = _asMap(json['screen_time']);
    return TvProfileData(
      name: _firstString(user, ['name'], fallback: 'Yangon TV viewer'),
      email: _firstString(user, ['email']),
      displayName: _firstString(profile, [
        'display_name',
      ], fallback: _firstString(user, ['name'], fallback: 'Yangon TV viewer')),
      entitlement: TvEntitlement.fromJson(entitlement),
      screenTimeLast30DaysSeconds:
          _intValue(screenTime['last_30_days_seconds']) ?? 0,
      deviceLimit: _intValue(json['device_limit']) ?? 2,
      devices: devicesValue is List
          ? devicesValue
                .whereType<Map>()
                .map(
                  (item) => TvDevice.fromJson(Map<String, dynamic>.from(item)),
                )
                .toList(growable: false)
          : const <TvDevice>[],
    );
  }
}

class TvLibraryEntry {
  const TvLibraryEntry({
    required this.contentType,
    required this.contentId,
    required this.title,
    required this.posterUrl,
    required this.year,
    required this.positionSeconds,
    required this.durationSeconds,
    required this.completed,
    required this.lastWatchedAt,
  });

  final String contentType;
  final int contentId;
  final String title;
  final String posterUrl;
  final String year;
  final int positionSeconds;
  final int? durationSeconds;
  final bool completed;
  final String? lastWatchedAt;

  factory TvLibraryEntry.fromJson(Map<String, dynamic> json) {
    final content = _asMap(json['content']);
    final contentType = _firstString(json, [
      'content_type',
    ], fallback: _firstString(content, ['kind'], fallback: 'movie'));
    final contentId = _intValue(json['content_id'] ?? content['id']) ?? 0;
    final yearValue = _firstString(content, ['year', 'release_date']);
    return TvLibraryEntry(
      contentType: contentType,
      contentId: contentId,
      title: _firstString(content, ['title', 'name'], fallback: 'Untitled'),
      posterUrl: _mediaUrl(_posterFromJson(content)),
      year: yearValue.length >= 4 ? yearValue.substring(0, 4) : yearValue,
      positionSeconds: _intValue(json['position_seconds']) ?? 0,
      durationSeconds: _intValue(json['duration_seconds']),
      completed: json['completed'] == true,
      lastWatchedAt: _nullableString(json['last_watched_at']),
    );
  }
}

class TvHomeBanner {
  const TvHomeBanner({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.displayOrder,
    this.linkUrl,
    this.buttonName,
  });

  final int id;
  final String name;
  final String imageUrl;
  final int displayOrder;
  final String? linkUrl;
  final String? buttonName;

  factory TvHomeBanner.fromJson(Map<String, dynamic> json) {
    final rawImage = _firstString(json, ['image_url', 'image', 'content']);
    final rawLink = _firstString(json, ['link_url']);
    final rawButtonName = _firstString(json, [
      'button_name',
      'button_label',
      'button_text',
    ]).trim();
    return TvHomeBanner(
      id: _intValue(json['id']) ?? 0,
      name: _firstString(json, ['name']).trim(),
      imageUrl: _safeBannerImageUrl(rawImage),
      displayOrder: _intValue(json['display_order']) ?? 0,
      linkUrl: _isHttpsUrl(rawLink) ? rawLink : null,
      buttonName: rawButtonName.isEmpty ? null : rawButtonName,
    );
  }

  bool get isUsable => imageUrl.isNotEmpty;
}

class TvHomeMarqueeEntry {
  const TvHomeMarqueeEntry({required this.content, this.textColor = '#E8C27E'});

  final String content;
  final String textColor;

  factory TvHomeMarqueeEntry.fromJson(Map<String, dynamic> json) {
    final rawColor = _firstString(json, ['text_color']).trim().toUpperCase();
    return TvHomeMarqueeEntry(
      content: _firstString(json, ['content']).trim(),
      textColor: RegExp(r'^#[0-9A-F]{6}$').hasMatch(rawColor)
          ? rawColor
          : '#E8C27E',
    );
  }
}

class TvBlogPost {
  const TvBlogPost({
    required this.id,
    required this.slug,
    required this.title,
    required this.excerpt,
    required this.date,
    required this.category,
    required this.author,
    required this.image,
    this.content = '',
  });

  final String id;
  final String slug;
  final String title;
  final String excerpt;
  final String date;
  final String category;
  final String author;
  final String image;
  final String content;

  factory TvBlogPost.fromJson(Map<String, dynamic> json) => TvBlogPost(
    id: _firstString(json, ['id']),
    slug: _firstString(json, ['slug']),
    title: _firstString(json, ['title'], fallback: 'Untitled story'),
    excerpt: _firstString(json, ['excerpt', 'summary']),
    date: _firstString(json, ['date', 'published_at']),
    category: _firstString(json, ['topic', 'category']),
    author: _firstString(json, ['author'], fallback: 'Yangon TV'),
    image: _mediaUrl(_firstString(json, ['cover', 'image', 'og_image'])),
    content: _firstString(json, ['content']),
  );
}

class TvSocialLink {
  const TvSocialLink({
    required this.id,
    required this.name,
    required this.icon,
    required this.url,
    required this.displayOrder,
    required this.isActive,
  });

  final int id;
  final String name;
  final String icon;
  final String url;
  final int displayOrder;
  final bool isActive;

  factory TvSocialLink.fromJson(Map<String, dynamic> json) {
    final rawActive = json['is_active'];
    return TvSocialLink(
      id: _intValue(json['id']) ?? 0,
      name: _firstString(json, ['name']).trim(),
      icon: _firstString(json, ['icon', 'icon_class']).trim(),
      url: _firstString(json, ['url', 'link_url']).trim(),
      displayOrder: _intValue(json['display_order']) ?? 0,
      isActive:
          rawActive == null ||
          rawActive == true ||
          rawActive == 1 ||
          rawActive?.toString() == '1',
    );
  }

  bool get isUsable {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;
    if (uri.scheme == 'https' || uri.scheme == 'http') {
      return uri.host.isNotEmpty;
    }
    return uri.scheme == 'mailto' && uri.path.contains('@');
  }
}

class TvNotificationEntry {
  const TvNotificationEntry({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.linkUrl,
    required this.createdAt,
    required this.readAt,
    this.isLocal = false,
  });

  final String id;
  final String title;
  final String message;
  final String? type;
  final String? linkUrl;
  final String? createdAt;
  final String? readAt;
  final bool isLocal;

  bool get isRead => readAt != null && readAt!.isNotEmpty;

  factory TvNotificationEntry.fromJson(Map<String, dynamic> json) =>
      TvNotificationEntry(
        id: '${json['id'] ?? ''}',
        title: _firstString(json, ['title']),
        message: _firstString(json, ['message']),
        type: _nullableString(json['type']),
        linkUrl: _nullableString(json['link_url']),
        createdAt: _nullableString(json['created_at']),
        readAt: _nullableString(json['read_at']),
        isLocal:
            json['is_local'] == true || '${json['id']}'.startsWith('local-'),
      );
}

class TvNotificationFeed {
  const TvNotificationFeed({
    required this.notifications,
    required this.unreadCount,
    this.hasServerUnreadCount = true,
    this.localUnreadCount = 0,
  });

  final List<TvNotificationEntry> notifications;
  final int unreadCount;
  final bool hasServerUnreadCount;
  final int localUnreadCount;

  bool get hasUnreadCount => hasServerUnreadCount || localUnreadCount > 0;

  factory TvNotificationFeed.fromJson(Map<String, dynamic> json) {
    final serverUnreadCount = _intValue(json['unread_count']);
    final rows = json['notifications'];
    final notifications = rows is List
        ? rows
              .whereType<Map>()
              .map(
                (row) => TvNotificationEntry.fromJson(
                  Map<String, dynamic>.from(row),
                ),
              )
              .toList(growable: false)
        : const <TvNotificationEntry>[];
    return TvNotificationFeed(
      notifications: notifications,
      unreadCount:
          serverUnreadCount ??
          notifications.where((item) => !item.isRead).length,
      hasServerUnreadCount: serverUnreadCount != null,
    );
  }
}

class PaymentAccount {
  const PaymentAccount({
    required this.id,
    required this.name,
    required this.accountName,
    required this.accountNumber,
    this.description = '',
    this.qrImageUrl = '',
    this.isActive = true,
  });

  final int id;
  final String name;
  final String accountName;
  final String accountNumber;
  final String description;
  final String qrImageUrl;
  final bool isActive;

  factory PaymentAccount.fromJson(Map<String, dynamic> json) => PaymentAccount(
    id: _intValue(json['id']) ?? 0,
    name: _firstString(json, ['name']),
    accountName: _firstString(json, ['account_name']),
    accountNumber: _firstString(json, ['account_number']),
    description: _firstString(json, ['description']),
    qrImageUrl: _firstString(json, ['qr_image_url']),
    isActive:
        json['is_active'] == null ||
        json['is_active'] == true ||
        json['is_active'] == 1 ||
        json['is_active'] == '1',
  );
}

class TvPaymentOrder {
  const TvPaymentOrder({
    required this.id,
    this.reference = '',
    this.purpose = '',
    this.planKey,
    this.amountKs = 0,
    this.status = '',
    this.uploadExpiresAt,
    this.receiptUploadedAt,
    this.receiptReference,
    this.reviewedAt,
    this.reviewNote,
  });

  final String id;
  final String reference;
  final String purpose;
  final String? planKey;
  final int amountKs;
  final String status;
  final String? uploadExpiresAt;
  final String? receiptUploadedAt;
  final String? receiptReference;
  final String? reviewedAt;
  final String? reviewNote;

  factory TvPaymentOrder.fromJson(Map<String, dynamic> json) => TvPaymentOrder(
    id: _firstString(json, ['id']),
    reference: _firstString(json, ['reference']),
    purpose: _firstString(json, ['purpose']),
    planKey: _nullableString(json['plan_key']),
    amountKs: _intValue(json['amount_ks']) ?? 0,
    status: _firstString(json, ['status']),
    uploadExpiresAt: _nullableString(json['upload_expires_at']),
    receiptUploadedAt: _nullableString(json['receipt_uploaded_at']),
    receiptReference: _nullableString(json['receipt_reference']),
    reviewedAt: _nullableString(json['reviewed_at']),
    reviewNote: _nullableString(json['review_note']),
  );
}

class AuthService {
  AuthService({
    http.Client? client,
    Future<String?> Function()? tokenReader,
    LocalNotificationStore? localNotificationStore,
    this.devicePayloadProvider,
  }) : _client = client ?? http.Client(),
       _tokenReader = tokenReader ?? (() => _storage.read(key: _tokenKey)),
       _localNotifications =
           localNotificationStore ??
           LocalNotificationStore(
             readValue: () => _storage.read(key: _localNotificationsKey),
             writeValue: (value) =>
                 _storage.write(key: _localNotificationsKey, value: value),
           );
  final http.Client _client;
  final Future<String?> Function() _tokenReader;
  final Future<Map<String, Object?>> Function()? devicePayloadProvider;
  final LocalNotificationStore _localNotifications;
  static const _tokenKey = 'ygntv_customer_session_token';
  static const _userKey = 'ygntv_customer_session_user';
  static const _deviceIdKey = 'ygntv_customer_device_id';
  static const _localNotificationsKey = 'ygntv_customer_local_notifications';
  final Uuid _uuid = const Uuid();

  Future<AuthSession?> restoreSession() async {
    final values = await Future.wait([
      _storage.read(key: _tokenKey),
      _storage.read(key: _userKey),
    ]);
    final token = values[0];
    final user = values[1];
    if (token == null || token.isEmpty || user == null || user.isEmpty) {
      return null;
    }
    try {
      return AuthSession.fromStored(token: token, json: user);
    } catch (_) {
      await clearSession();
      return null;
    }
  }

  Future<AuthSession> signIn(String email, String password) => _emailAuth(
    '/tv/auth/login',
    {'email': email.trim(), 'password': password},
  );

  Future<AuthSession> signUp(
    String name,
    String email,
    String password, {
    String? referralCode,
  }) => _emailAuth('/tv/auth/register', {
    'name': name.trim(),
    'email': email.trim(),
    'password': password,
    'password_confirmation': password,
    if (referralCode != null && referralCode.trim().isNotEmpty)
      'referral_code': referralCode.trim(),
  });

  Future<AuthSession> _emailAuth(
    String path,
    Map<String, Object?> fields,
  ) async {
    final device = await _devicePayload();
    final response = await _client
        .post(
          Uri.parse('$_apiBase$path'),
          headers: const {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({...fields, ...device}),
        )
        .timeout(const Duration(seconds: 25));
    return _saveApiSession(response);
  }

  Future<AuthSession> signInWithGoogle() => _nativeOAuth('google');

  Future<AuthSession> signInWithTelegram() => _nativeOAuth('telegram');

  Future<AuthSession> _nativeOAuth(String provider) async {
    final device = await _devicePayload();
    final query = {
      'return_uri': _mobileReturnUri,
      ...device.map((key, value) => MapEntry(key, '$value')),
    };
    final authorizationUrl = Uri.https(
      _apiHost,
      provider == 'google'
          ? '/api/tv/auth/google/redirect'
          : '/auth/$provider/redirect',
      query,
    );
    final callback = await FlutterWebAuth2.authenticate(
      url: authorizationUrl.toString(),
      callbackUrlScheme: _callbackScheme,
    );
    final callbackUri = Uri.tryParse(callback);
    if (callbackUri == null || callbackUri.scheme != _callbackScheme) {
      throw const AuthException(
        'Sign-in did not return to the YGNTV app. Please try again.',
      );
    }
    final error = callbackUri.queryParameters['error'];
    if (error != null && error.isNotEmpty) throw AuthException(error);
    final code = callbackUri.queryParameters['code'];
    if (code == null || code.isEmpty) {
      throw const AuthException(
        'The sign-in code was missing. Please try again.',
      );
    }
    final response = await _client
        .post(
          Uri.parse('$_apiBase/tv/auth/$provider/exchange'),
          headers: const {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'code': code, ...device}),
        )
        .timeout(const Duration(seconds: 25));
    return _saveApiSession(response);
  }

  Future<Map<String, Object?>> _devicePayload() async {
    final provider = devicePayloadProvider;
    if (provider != null) return provider();

    var deviceId = await _storage.read(key: _deviceIdKey);
    if (deviceId == null || deviceId.length < 16) {
      deviceId = _uuid.v4();
      await _storage.write(key: _deviceIdKey, value: deviceId);
    }

    var deviceName = 'Android phone';
    try {
      final info = await DeviceInfoPlugin().androidInfo;
      final brand = info.brand.trim();
      final model = info.model.trim();
      deviceName = [brand, model].where((part) => part.isNotEmpty).join(' ');
      if (deviceName.length < 2) deviceName = 'Android phone';
      if (deviceName.length > 120) deviceName = deviceName.substring(0, 120);
    } catch (_) {
      // Use a generic device label if Android metadata is unavailable.
    }

    var appVersion = '1.0.0';
    try {
      appVersion = (await PackageInfo.fromPlatform()).version;
    } catch (_) {
      // Keep the fallback version in tests or unusual Android builds.
    }
    return {
      'device_id': deviceId,
      'device_name': deviceName,
      'platform': 'android_mobile',
      'app_version': appVersion,
    };
  }

  Future<List<TvHomeBanner>> getTopAdBanners() async {
    final response = await _get(
      '/public/ads',
      query: const {'position': 'top'},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final banners =
        _rowsFrom(root)
            .where(
              (row) => _firstString(row, ['type']).toLowerCase() == 'banner',
            )
            .where((row) {
              final active = row['is_active'];
              return active == null ||
                  active == true ||
                  active == 1 ||
                  active == '1';
            })
            .map(TvHomeBanner.fromJson)
            .where((banner) => banner.isUsable)
            .toList(growable: false)
          ..sort((a, b) {
            final order = a.displayOrder.compareTo(b.displayOrder);
            return order != 0 ? order : a.id.compareTo(b.id);
          });
    return banners;
  }

  Future<List<TvBlogPost>> getBlogPosts({int page = 1}) async {
    final response = await _get('/public/blogs', query: {'page': '$page'});
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map(TvBlogPost.fromJson)
        .where((post) => post.title.isNotEmpty)
        .toList(growable: false);
  }

  Future<TvBlogPost> getBlogPost(String slug) async {
    final response = await _get(
      '/public/blogs/${Uri.encodeComponent(slug.trim())}',
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final data = _mapFrom(root);
    if (data.isEmpty) {
      throw const AuthException('This blog story could not be found.');
    }
    return TvBlogPost.fromJson(data);
  }

  Future<List<TvHomeMarqueeEntry>> getHomeMarqueeEntries() async {
    final response = await _get(
      '/public/ads',
      query: const {'position': 'header_marquee'},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .where(
          (row) =>
              _firstString(row, ['position']).toLowerCase() == 'header_marquee',
        )
        .map(TvHomeMarqueeEntry.fromJson)
        .where((entry) => entry.content.isNotEmpty)
        .toList(growable: false);
  }

  Future<String> getHomeMarquee() async => (await getHomeMarqueeEntries())
      .map((entry) => entry.content)
      .join('   •   ');

  Future<List<TvSocialLink>> getSocialLinks() async {
    final response = await _get('/socials');
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final links =
        _rowsFrom(root)
            .map(TvSocialLink.fromJson)
            .where((link) => link.id > 0 && link.isActive && link.isUsable)
            .toList(growable: false)
          ..sort((a, b) {
            final order = a.displayOrder.compareTo(b.displayOrder);
            return order != 0 ? order : a.id.compareTo(b.id);
          });
    return links;
  }

  Future<List<CatalogItem>> loadCatalog(
    String kind, {
    int page = 1,
    int perPage = 48,
  }) async {
    final endpoint = kind == 'movie' ? '/movies' : '/shows';
    final response = await _get(
      endpoint,
      query: {'page': '$page', 'per_page': '$perPage'},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map((row) => CatalogItem.fromJson(row, kind))
        .where((item) => item.title.isNotEmpty)
        .toList(growable: false);
  }

  Future<CatalogItem> loadDetail(CatalogItem item) async {
    final endpoint = item.kind == 'movie' ? '/movies' : '/shows';
    final path = item.slug.isNotEmpty
        ? '$endpoint/slug/${Uri.encodeComponent(item.slug)}'
        : '$endpoint/${item.id ?? 0}';
    final response = await _get(path);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final data = _mapFrom(root);
    if (data.isEmpty) throw const AuthException('This title is not available.');
    return CatalogItem.fromJson(data, item.kind);
  }

  Future<List<CatalogItem>> searchCatalog(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return const [];
    final results = await Future.wait([
      _searchKind('/movies/search', trimmed, 'movie'),
      _searchKind('/shows/search', trimmed, 'series'),
    ]);
    return results.expand((items) => items).toList(growable: false)
      ..sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
  }

  Future<List<CatalogItem>> _searchKind(
    String path,
    String query,
    String kind,
  ) async {
    final response = await _get(path, query: {'query': query});
    final root = _decodeMap(response.body);
    if (response.statusCode == 404) return const [];
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map((row) => CatalogItem.fromJson(row, kind))
        .toList(growable: false);
  }

  Future<TvPlaybackPayload> getPlayback(
    String contentType,
    int contentId, {
    String action = 'watch',
  }) async {
    if (contentId < 1) {
      throw const AuthException('This title has no playback record yet.');
    }
    final type = contentType == 'episode' ? 'episodes' : 'movies';
    final response = await _get(
      '/tv/playback/$type/$contentId',
      authenticated: true,
      query: {'action': action},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final data = _mapFrom(root);
    return TvPlaybackPayload.fromJson(
      data,
      playbackCookie: _playbackCookie(response.headers['set-cookie'] ?? ''),
    );
  }

  Future<TvProfileData> getProfile() async {
    final response = await _get('/tv/profile', authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return TvProfileData.fromJson(_mapFrom(root));
  }

  Future<void> recordScreenTime({
    required String sessionId,
    required String event,
  }) async {
    if (!const {'start', 'heartbeat', 'end'}.contains(event)) return;
    final response = await _post('/tv/screen-time', {
      'session_id': sessionId,
      'event': event,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
  }

  Future<Map<String, dynamic>> getDailySignInWheelOverview() async {
    final response = await _get('/tv/daily-signin-wheel', authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<Map<String, dynamic>> spinDailySignInWheel({
    required String spinKey,
  }) async {
    final response = await _post('/tv/daily-signin-wheel/spin', {
      'spin_key': spinKey,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<Map<String, dynamic>> getDailyWheelOptions({
    required String spinId,
    required String type,
    required int page,
    String search = '',
  }) async {
    final response = await _get(
      '/tv/daily-signin-wheel/${Uri.encodeComponent(spinId)}/options',
      authenticated: true,
      query: {'type': type, 'page': '$page', 'search': search},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<Map<String, dynamic>> commitDailyWheelSelection({
    required String spinId,
    required String type,
    List<int> contentIds = const [],
    int? seasonId,
  }) async {
    final body = type == 'season'
        ? <String, Object?>{'type': 'season', 'season_id': seasonId}
        : <String, Object?>{
            'type': type,
            'content_ids': List<int>.unmodifiable(contentIds),
          };
    final response = await _post(
      '/tv/daily-signin-wheel/${Uri.encodeComponent(spinId)}/select',
      body,
      authenticated: true,
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<Map<String, dynamic>> recordFreeWatchHeartbeat({
    required String watchSessionKey,
    required String heartbeatKey,
    required bool isPlaying,
  }) async {
    final response = await _post('/tv/daily-signin-wheel/heartbeat', {
      'watch_session_key': watchSessionKey,
      'heartbeat_key': heartbeatKey,
      'is_playing': isPlaying,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<List<TvPremiumPlan>> getPremiumPlans() async {
    final response = await _get('/tv/premium-plans');
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map(TvPremiumPlan.fromJson)
        .where((plan) => plan.key.isNotEmpty)
        .toList(growable: false);
  }

  Future<List<PaymentAccount>> getPaymentAccounts() async {
    final response = await _get('/public/payment-accounts');
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map(PaymentAccount.fromJson)
        .where((account) => account.id > 0 && account.isActive)
        .toList(growable: false);
  }

  Future<TvPaymentOrder> createPaymentOrder({
    required int paymentAccountId,
    required String planKey,
  }) async {
    final response = await _post('/tv/payment-orders', {
      'payment_account_id': paymentAccountId,
      'plan_key': planKey,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final order = _asMap(_mapFrom(root)['order']);
    if (order.isEmpty || _firstString(order, ['id']).isEmpty) {
      throw const AuthException(
        'The payment service returned an incomplete order.',
      );
    }
    return TvPaymentOrder.fromJson(order);
  }

  Future<TvPaymentOrder> submitOrderReceipt({
    required String orderId,
    required List<int> receiptBytes,
    required String fileName,
    required String mimeType,
    String? receiptReference,
  }) async {
    const allowedMimeTypes = {'image/jpeg', 'image/png', 'image/webp'};
    final normalizedMimeType = mimeType.toLowerCase();
    if (receiptBytes.isEmpty) {
      throw const AuthException('Choose a receipt image before submitting.');
    }
    if (receiptBytes.length > 5 * 1024 * 1024) {
      throw const AuthException('Receipt images must be 5 MB or smaller.');
    }
    if (!allowedMimeTypes.contains(normalizedMimeType)) {
      throw const AuthException('Choose a JPG, PNG, or WebP receipt image.');
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse(
        '$_apiBase/tv/payment-orders/${Uri.encodeComponent(orderId)}/submit-receipt',
      ),
    );
    request.headers.addAll(await _headers(authenticated: true));
    request.files.add(
      http.MultipartFile.fromBytes(
        'receipt',
        receiptBytes,
        filename: fileName,
        contentType: MediaType.parse(normalizedMimeType),
      ),
    );
    final trimmedReference = receiptReference?.trim();
    if (trimmedReference != null && trimmedReference.isNotEmpty) {
      request.fields['receipt_reference'] = trimmedReference;
    }

    final streamed = await _client
        .send(request)
        .timeout(const Duration(seconds: 60));
    final response = await http.Response.fromStream(streamed)
        .timeout(const Duration(seconds: 60));
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final payload = _mapFrom(root);
    final nestedOrder = _asMap(payload['order']);
    final order = nestedOrder.isEmpty ? payload : nestedOrder;
    if (_firstString(order, ['id']).isEmpty) {
      throw const AuthException(
        'The payment service returned an incomplete receipt status.',
      );
    }
    return TvPaymentOrder.fromJson(order);
  }

  Future<Map<String, dynamic>> redeemMembership(String code) async {
    final response = await _post('/tv/membership/redeem', {
      'code': code.trim(),
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<List<SupportConversationSummary>> getSupportConversations() async {
    final response = await _get('/support/conversations', authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final rows = _mapFrom(root)['conversations'];
    if (rows is! List) return const [];
    return rows
        .whereType<Map>()
        .map(
          (row) => SupportConversationSummary.fromJson(
            Map<String, dynamic>.from(row),
          ),
        )
        .where((conversation) => conversation.publicToken.isNotEmpty)
        .toList(growable: false);
  }

  Future<SupportMessagesPage> startSupportConversation({
    String? publicToken,
    String pageUrl = 'yangontv://account/help',
  }) async {
    final response = await _post('/support/start', {
      'public_token': publicToken,
      'page_url': pageUrl,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return SupportMessagesPage.fromJson(_mapFrom(root));
  }

  Future<SupportMessagesPage> getSupportMessages(
    String publicToken, {
    int afterId = 0,
  }) async {
    final response = await _get(
      '/support/${Uri.encodeComponent(publicToken)}/messages',
      authenticated: true,
      query: {'after_id': '$afterId'},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return SupportMessagesPage.fromJson(_mapFrom(root));
  }

  Future<SupportChatMessage> sendSupportMessage(
    String publicToken,
    String body,
  ) async {
    final response = await _post(
      '/support/${Uri.encodeComponent(publicToken)}/messages',
      {'body': body.trim(), 'page_url': 'yangontv://account/help'},
      authenticated: true,
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final message = _asMap(_mapFrom(root)['message']);
    if (message.isEmpty) {
      throw const AuthException(
        'The support service returned an incomplete message.',
      );
    }
    return SupportChatMessage.fromJson(message);
  }

  Future<void> revokeDevice(int deviceId) async {
    final response = await _delete(
      '/tv/profile/devices/$deviceId',
      authenticated: true,
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
  }

  Future<List<TvLibraryEntry>> getContinueWatching() async {
    final response = await _get(
      '/tv/library/continue-watching',
      authenticated: true,
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map(TvLibraryEntry.fromJson)
        .where((entry) => entry.contentId > 0)
        .toList(growable: false);
  }

  Future<List<TvLibraryEntry>> getWatchHistory({int page = 1}) async {
    final response = await _get(
      '/tv/library/history',
      authenticated: true,
      query: {'page': '$page'},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map(TvLibraryEntry.fromJson)
        .where((entry) => entry.contentId > 0)
        .toList(growable: false);
  }

  Future<List<TvLibraryEntry>> getSavedContent({int page = 1}) async {
    final response = await _get(
      '/tv/library/saved',
      authenticated: true,
      query: {'page': '$page'},
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _rowsFrom(root)
        .map(TvLibraryEntry.fromJson)
        .where((entry) => entry.contentId > 0)
        .toList(growable: false);
  }

  Future<void> saveContent(
    String contentType,
    int contentId, {
    String? title,
  }) async {
    final response = await _post('/tv/library/saved', {
      'content_type': contentType,
      'content_id': contentId,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    await recordLocalNotification(
      title: 'Saved to My List',
      message:
          '“${title?.trim().isNotEmpty == true ? title : 'This title'}” was added to My List.',
      type: 'library_saved',
    );
  }

  Future<void> removeSavedContent(
    String contentType,
    int contentId, {
    String? title,
  }) async {
    final response = await _delete(
      '/tv/library/saved/$contentType/$contentId',
      authenticated: true,
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    await recordLocalNotification(
      title: 'Removed from My List',
      message:
          '“${title?.trim().isNotEmpty == true ? title : 'This title'}” was removed from My List.',
      type: 'library_removed',
    );
  }

  Future<void> updateViewingProgress({
    required String contentType,
    required int contentId,
    required int positionSeconds,
    int? durationSeconds,
    bool completed = false,
  }) async {
    final response = await _put('/tv/library/progress', {
      'content_type': contentType,
      'content_id': contentId,
      'position_seconds': positionSeconds,
      if (durationSeconds != null && durationSeconds > 0)
        'duration_seconds': durationSeconds,
      'completed': completed,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
  }

  Future<TvNotificationFeed> getNotifications() async {
    final response = await _get('/tv/notifications', authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mergeLocalNotifications(
      TvNotificationFeed.fromJson(_mapFrom(root)),
    );
  }

  Future<TvNotificationFeed> markNotificationRead(String id) async {
    if (id.startsWith('local-')) {
      await _localNotifications.markRead(id);
      return getNotifications();
    }
    final response = await _post(
      '/tv/notifications/${Uri.encodeComponent(id)}/read',
      const {},
      authenticated: true,
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mergeLocalNotifications(
      TvNotificationFeed.fromJson(_mapFrom(root)),
    );
  }

  Future<TvNotificationFeed> markAllNotificationsRead() async {
    final response = await _post(
      '/tv/notifications/read-all',
      const {},
      authenticated: true,
    );
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    await _localNotifications.markAllRead();
    return _mergeLocalNotifications(
      TvNotificationFeed.fromJson(_mapFrom(root)),
    );
  }

  Future<void> recordLocalNotification({
    required String title,
    required String message,
    required String type,
    String? linkUrl,
  }) async {
    try {
      await _localNotifications.addNotification(
        title: title,
        message: message,
        type: type,
        linkUrl: linkUrl,
      );
    } catch (_) {
      // Local notices must never prevent the requested app action.
    }
  }

  Future<TvNotificationFeed> _mergeLocalNotifications(
    TvNotificationFeed serverFeed,
  ) async {
    try {
      final localRows = await _localNotifications.getNotifications();
      final localEntries = localRows
          .map(TvNotificationEntry.fromJson)
          .toList(growable: false);
      final notifications = [...serverFeed.notifications, ...localEntries];
      notifications.sort(
        (a, b) => _notificationDate(b).compareTo(_notificationDate(a)),
      );
      final localUnreadCount = localEntries
          .where((item) => !item.isRead)
          .length;
      return TvNotificationFeed(
        notifications: notifications,
        unreadCount: serverFeed.unreadCount + localUnreadCount,
        hasServerUnreadCount: serverFeed.hasServerUnreadCount,
        localUnreadCount: localUnreadCount,
      );
    } catch (_) {
      return serverFeed;
    }
  }

  DateTime _notificationDate(TvNotificationEntry item) =>
      DateTime.tryParse(item.createdAt ?? '') ??
      DateTime.fromMillisecondsSinceEpoch(0);

  Future<void> _recordDownloadOutcomes(
    List<TvDownloadProgress> downloads,
  ) async {
    try {
      await _localNotifications.recordFinishedDownloads(
        downloads.map(
          (download) => LocalDownloadResult(
            id: download.id,
            title: download.title,
            status: download.status,
            message: download.message,
          ),
        ),
      );
    } catch (_) {
      // Download polling continues even when local notice storage is unavailable.
    }
  }

  Future<DownloadTarget?> createDownloadTarget(
    TvPlaybackPayload playback, {
    required String title,
    required TvPlaybackSource source,
  }) async {
    if (!{'r2', 'telegram_mtproto'}.contains(source.provider)) return null;
    final selectedUrl = source.downloadLinks
        .where(
          (url) => _isProtectedServerUrl(url, source.provider, download: true),
        )
        .firstOrNull;
    if (selectedUrl == null) return null;
    if (playback.playbackCookie.isEmpty) {
      throw const AuthException(
        'The playback session was not returned. Please sign in again and retry.',
      );
    }
    return DownloadTarget(
      url: selectedUrl,
      headers: {
        'Origin': _webOrigin,
        'Cookie': 'ygntv_playback_session=${playback.playbackCookie}',
      },
      fileName: _safeFileName(title),
    );
  }

  Future<int> enqueueDownload(DownloadTarget target) async {
    try {
      final id = await _downloadChannel.invokeMethod<int>('enqueue', {
        'url': target.url,
        'headers': target.headers,
        'fileName': target.fileName,
        'title': target.fileName.replaceAll(
          RegExp(r'\.mp4$', caseSensitive: false),
          '',
        ),
      });
      if (id == null) {
        throw const AuthException('Android could not start the download.');
      }
      final title = target.fileName.replaceAll(
        RegExp(r'\.mp4$', caseSensitive: false),
        '',
      );
      try {
        await _localNotifications.trackDownload(id);
      } catch (_) {
        // The Android download still succeeds if local tracking is unavailable.
      }
      await recordLocalNotification(
        title: 'Download started',
        message:
            '“$title” is downloading. You can follow its progress in Updates.',
        type: 'download_started',
      );
      return id;
    } on PlatformException catch (error) {
      throw AuthException(
        error.message ?? 'Android could not start the download.',
      );
    } on MissingPluginException {
      throw const AuthException(
        'Downloads are not available on this device build.',
      );
    }
  }

  Future<List<TvDownloadProgress>> getAndroidDownloads() async {
    try {
      final rows = await _downloadChannel.invokeListMethod<dynamic>('list');
      final downloads = (rows ?? const <dynamic>[])
          .whereType<Map>()
          .map(
            (row) => TvDownloadProgress.fromMap(Map<String, dynamic>.from(row)),
          )
          .where((download) => download.id > 0)
          .toList(growable: false);
      await _recordDownloadOutcomes(downloads);
      return downloads;
    } on PlatformException {
      return const <TvDownloadProgress>[];
    } on MissingPluginException {
      return const <TvDownloadProgress>[];
    }
  }

  Future<void> dismissAndroidDownload(int id) async {
    try {
      await _downloadChannel.invokeMethod<void>('dismiss', {'id': id});
      await _localNotifications.forgetDownload(id);
    } on PlatformException {
      // A local download notice can be dismissed again if Android is busy.
    } on MissingPluginException {
      // Older installed builds may not implement the new local method.
    }
  }

  Future<void> deleteAndroidDownload(int id) async {
    try {
      await _downloadChannel.invokeMethod<void>('delete', {'id': id});
      await _localNotifications.forgetDownload(id);
    } on PlatformException catch (error) {
      throw AuthException(
        error.message ?? 'The downloaded video could not be removed.',
      );
    } on MissingPluginException {
      throw const AuthException(
        'Download management is not available on this device build.',
      );
    }
  }

  Future<Map<String, dynamic>> getReferralOverview() async {
    final response = await _get('/tv/referrals', authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<Map<String, dynamic>> requestReferralWithdrawal({
    required int amountKs,
    required String paymentMethod,
    required String payoutAddress,
    required String requestKey,
  }) async {
    final response = await _post('/tv/referrals/withdrawals', {
      'amount_ks': amountKs,
      'payment_method': paymentMethod,
      'payout_address': payoutAddress.trim(),
      'request_key': requestKey,
    }, authenticated: true);
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    return _mapFrom(root);
  }

  Future<void> logout() async {
    try {
      final response = await _post(
        '/logout',
        const {},
        authenticated: true,
      ).timeout(const Duration(seconds: 2));
      if (response.statusCode == 401) {
        await clearSession();
        return;
      }
    } catch (_) {
      // Clear the local session even if the server cannot be reached.
    }
    await clearSession();
  }

  Future<http.Response> _get(
    String path, {
    bool authenticated = false,
    Map<String, String>? query,
  }) async {
    final headers = await _headers(authenticated: authenticated);
    final base = Uri.parse('$_apiBase$path');
    final uri = query == null || query.isEmpty
        ? base
        : base.replace(queryParameters: query);
    return _client
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: 25));
  }

  Future<http.Response> _post(
    String path,
    Map<String, Object?> body, {
    bool authenticated = false,
  }) async {
    final headers = await _headers(authenticated: authenticated, json: true);
    return _client
        .post(
          Uri.parse('$_apiBase$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 25));
  }

  Future<http.Response> _put(
    String path,
    Map<String, Object?> body, {
    bool authenticated = false,
  }) async {
    final headers = await _headers(authenticated: authenticated, json: true);
    return _client
        .put(
          Uri.parse('$_apiBase$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 25));
  }

  Future<http.Response> _delete(
    String path, {
    bool authenticated = false,
  }) async {
    final headers = await _headers(authenticated: authenticated);
    return _client
        .delete(Uri.parse('$_apiBase$path'), headers: headers)
        .timeout(const Duration(seconds: 25));
  }

  Future<Map<String, String>> _headers({
    bool authenticated = false,
    bool json = false,
  }) async {
    final headers = <String, String>{
      'Accept': 'application/json',
      if (json) 'Content-Type': 'application/json',
    };
    if (authenticated) {
      final token = await _tokenReader();
      if (token == null || token.isEmpty) {
        throw const AuthException(
          'Please sign in to continue.',
          statusCode: 401,
        );
      }
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  void _checkResponse(http.Response response, Map<String, dynamic> root) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw _exceptionFrom(root, response.statusCode);
    }
  }

  Future<AuthSession> _saveApiSession(http.Response response) async {
    final root = _decodeMap(response.body);
    _checkResponse(response, root);
    final data = _mapFrom(root);
    final token = '${data['token'] ?? data['access_token'] ?? ''}';
    final user = _asMap(data['user']);
    if (token.isEmpty) {
      throw const AuthException('The server did not return a sign-in session.');
    }
    final session = AuthSession(
      token: token,
      userId: '${user['id'] ?? ''}',
      name: '${user['name'] ?? user['display_name'] ?? 'Yangon TV viewer'}',
      email: '${user['email'] ?? ''}',
    );
    await _storage.write(key: _tokenKey, value: session.token);
    await _storage.write(key: _userKey, value: jsonEncode(session.toJson()));
    return session;
  }

  Future<void> clearSession() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }

  void dispose() => _client.close();
}

class AuthException implements Exception {
  const AuthException(this.message, {this.statusCode, this.code});
  final String message;
  final int? statusCode;
  final String? code;
  @override
  String toString() => message;
}

AuthException _exceptionFrom(Map<String, dynamic> payload, int statusCode) {
  final errors = payload['errors'];
  if (errors is Map) {
    for (final value in errors.values) {
      if (value is List && value.isNotEmpty) {
        return AuthException(
          '${value.first}',
          statusCode: statusCode,
          code: _nullableString(payload['code']),
        );
      }
    }
  }
  final data = _asMap(payload['data']);
  final message = payload['message'] ?? payload['error'] ?? data['message'];
  final fallback = statusCode == 401 || statusCode == 422
      ? 'Please check your details and try again.'
      : 'Could not connect to YGNTV. Check your connection and try again.';
  return AuthException(
    message is String && message.trim().isNotEmpty ? message.trim() : fallback,
    statusCode: statusCode,
    code: _nullableString(payload['code'] ?? data['code']),
  );
}

Map<String, dynamic> _decodeMap(String body) {
  try {
    final value = jsonDecode(body);
    if (value is Map<String, dynamic>) return value;
  } catch (_) {
    // The caller will present a safe generic message for malformed responses.
  }
  return <String, dynamic>{};
}

Map<String, dynamic> _asMap(dynamic value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

Map<String, dynamic> _mapFrom(Map<String, dynamic> root) {
  final data = root['data'];
  return data is Map ? Map<String, dynamic>.from(data) : root;
}

List<Map<String, dynamic>> _rowsFrom(Map<String, dynamic> root) {
  dynamic data = root['data'];
  if (data is Map && data['data'] is List) data = data['data'];
  if (data is! List) return const [];
  return data
      .whereType<Map>()
      .map((row) => Map<String, dynamic>.from(row))
      .toList();
}

String _firstString(
  Map<String, dynamic> json,
  List<String> keys, {
  String fallback = '',
}) {
  for (final key in keys) {
    final value = json[key];
    if (value is String && value.trim().isNotEmpty) return value.trim();
    if (value is num) return '$value';
  }
  return fallback;
}

String? _nullableString(dynamic value) {
  if (value == null) return null;
  final text = '$value'.trim();
  return text.isEmpty ? null : text;
}

int? _intValue(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value.trim());
  return null;
}

double _doubleValue(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value.trim()) ?? 0;
  return 0;
}

List<String> _stringList(dynamic value) {
  if (value is List) {
    return value
        .map((item) {
          if (item is String) return item.trim();
          if (item is Map) {
            final row = Map<String, dynamic>.from(item);
            return _firstString(row, ['name', 'title', 'value']);
          }
          return '';
        })
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }
  if (value is String && value.trim().isNotEmpty) {
    try {
      final decoded = jsonDecode(value);
      if (decoded is List) return _stringList(decoded);
    } catch (_) {
      return [value.trim()];
    }
  }
  return const [];
}

List<TvPlaybackSource> _playbackSources(dynamic value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((row) => TvPlaybackSource.tryParse(Map<String, dynamic>.from(row)))
      .whereType<TvPlaybackSource>()
      .toList(growable: false);
}

String _posterFromJson(Map<String, dynamic> json) {
  final posterPath = _firstString(json, ['poster_path']);
  if (posterPath.startsWith('/') && !posterPath.startsWith('/storage/')) {
    return 'https://image.tmdb.org/t/p/w500$posterPath';
  }
  final value = _firstString(json, [
    'poster_url',
    'poster',
    'image',
    'thumbnail',
    'backdrop',
    'poster_path',
  ]);
  return _tmdbImageSize(value, 'w500');
}

String _backdropFromJson(Map<String, dynamic> json) {
  final path = _firstString(json, ['backdrop_path']);
  if (path.startsWith('/') && !path.startsWith('/storage/')) {
    return 'https://image.tmdb.org/t/p/w780$path';
  }
  return _tmdbImageSize(
    _firstString(json, ['backdrop_url', 'backdrop', 'cover']),
    'w780',
  );
}

String _tmdbImageSize(String value, String size) {
  final uri = Uri.tryParse(value);
  if (uri == null || uri.host != 'image.tmdb.org') return value;
  final segments = uri.pathSegments;
  if (segments.length < 4 || segments[0] != 't' || segments[1] != 'p') {
    return value;
  }
  final resized = [...segments];
  resized[2] = size;
  return uri.replace(pathSegments: resized).toString();
}

String _mediaUrl(String value) {
  if (value.isEmpty) return '';
  final uri = Uri.tryParse(value);
  if (uri != null &&
      (uri.scheme == 'http' || uri.scheme == 'https') &&
      uri.host.isNotEmpty) {
    // TMDB images stay on image.tmdb.org; do not route them through the API proxy.
    return value;
  }
  return 'https://api.ygntv.org/${value.replaceFirst(RegExp(r'^/+'), '')}';
}

int? _numberFromTitle(String title) {
  final match = RegExp(
    r'(?:season|episode|s|e)?\s*(\d+)\s*$',
    caseSensitive: false,
  ).firstMatch(title.trim());
  return match == null ? null : int.tryParse(match.group(1)!);
}

String _playbackCookie(String setCookie) {
  final match = RegExp(r'(?:^|[,;\s])ygntv_playback_session=([^;,\s]+)')
      .firstMatch(setCookie);
  return match?.group(1) ?? '';
}

bool _isHttpsUrl(String value) {
  final uri = Uri.tryParse(value);
  return uri != null && uri.scheme == 'https' && uri.host.isNotEmpty;
}

String _safeBannerImageUrl(String value) {
  final trimmed = value.trim();
  if (_isHttpsUrl(trimmed)) return trimmed;
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '';
  final uri = Uri.tryParse(trimmed);
  if (uri == null || uri.hasScheme || uri.hasAuthority) return '';
  return Uri.https(
    _apiHost,
    trimmed.replaceFirst(RegExp(r'^/+'), ''),
  ).toString();
}

bool _isProtectedServerUrl(
  String value,
  String provider, {
  bool download = false,
}) {
  if (!{'r2', 'telegram_mtproto'}.contains(provider)) return false;
  final uri = Uri.tryParse(value);
  final host = provider == 'r2' ? 'stream.ygntv.org' : 'stream-2.ygntv.org';
  return uri != null &&
      uri.scheme == 'https' &&
      uri.host.toLowerCase() == host &&
      (uri.port == 443 || uri.hasPort == false) &&
      uri.userInfo.isEmpty &&
      uri.fragment.isEmpty &&
      (download ? uri.query == 'download=1' : uri.query.isEmpty) &&
      RegExp(
        r'^/videos/(?:m|e)-[1-9][0-9]*/(?:360p|480p|720p|1080p|1440p|2160p|source)\.mp4$',
      ).hasMatch(uri.path);
}

String _safeFileName(String title) {
  var name = title.trim().replaceAll(RegExp(r'[^A-Za-z0-9._ -]+'), '-');
  name = name.replaceAll(RegExp(r'\s+'), '_').replaceAll(RegExp(r'_+'), '_');
  if (name.isEmpty) name = 'yangon-tv-video';
  if (name.length > 110) name = name.substring(0, 110);
  if (!name.toLowerCase().endsWith('.mp4')) name = '$name.mp4';
  return name;
}
