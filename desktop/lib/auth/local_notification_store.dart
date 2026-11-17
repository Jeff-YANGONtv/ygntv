import 'dart:async';
import 'dart:convert';
import 'dart:math';

class LocalNotificationStore {
  LocalNotificationStore({required this.readValue, required this.writeValue});

  final Future<String?> Function() readValue;
  final Future<void> Function(String value) writeValue;
  Future<void> _tail = Future<void>.value();

  Future<List<Map<String, dynamic>>> getNotifications() => _run(() async {
    final data = await _read();
    final rows = data['notifications'];
    if (rows is! List) return const <Map<String, dynamic>>[];
    return rows
        .whereType<Map>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList(growable: false);
  });

  Future<void> addNotification({
    required String title,
    required String message,
    required String type,
    String? linkUrl,
  }) => _run(() async {
    final data = await _read();
    final rows = _notifications(data);
    rows.insert(0, {
      'id': _newId(),
      'title': title,
      'message': message,
      'type': type,
      'link_url': linkUrl,
      'created_at': DateTime.now().toUtc().toIso8601String(),
      'read_at': null,
      'is_local': true,
    });
    if (rows.length > 100) rows.removeRange(100, rows.length);
    data['notifications'] = rows;
    await _write(data);
  });

  Future<void> markRead(String id) => _run(() async {
    final data = await _read();
    final rows = _notifications(data);
    final index = rows.indexWhere((row) => '${row['id'] ?? ''}' == id);
    if (index < 0 || rows[index]['read_at'] != null) return;
    rows[index]['read_at'] = DateTime.now().toUtc().toIso8601String();
    data['notifications'] = rows;
    await _write(data);
  });

  Future<void> markAllRead() => _run(() async {
    final data = await _read();
    final rows = _notifications(data);
    final readAt = DateTime.now().toUtc().toIso8601String();
    var changed = false;
    for (final row in rows) {
      if (row['read_at'] == null) {
        row['read_at'] = readAt;
        changed = true;
      }
    }
    if (changed) {
      data['notifications'] = rows;
      await _write(data);
    }
  });

  Future<void> trackDownload(int id) => _run(() async {
    final data = await _read();
    final ids = _downloadIds(data);
    if (!ids.contains(id)) {
      ids.add(id);
      data['tracked_download_ids'] = ids;
      await _write(data);
    }
  });

  Future<void> forgetDownload(int id) => _run(() async {
    final data = await _read();
    final ids = _downloadIds(data);
    if (ids.remove(id)) {
      data['tracked_download_ids'] = ids;
      await _write(data);
    }
  });

  Future<void> recordFinishedDownloads(
    Iterable<LocalDownloadResult> downloads,
  ) => _run(() async {
    final data = await _read();
    final pendingIds = _downloadIds(data).toSet();
    if (pendingIds.isEmpty) return;
    final rows = _notifications(data);
    var changed = false;
    for (final download in downloads) {
      if (!pendingIds.contains(download.id) ||
          (download.status != 'complete' && download.status != 'failed')) {
        continue;
      }
      rows.insert(0, {
        'id': _newId(),
        'title': download.status == 'complete'
            ? 'Download complete'
            : 'Download failed',
        'message': download.status == 'complete'
            ? '“${download.title}” is ready to watch offline.'
            : '“${download.title}” could not be downloaded${download.message == null ? '.' : ': ${download.message}'}',
        'type': download.status == 'complete'
            ? 'download_complete'
            : 'download_failed',
        'link_url': null,
        'created_at': DateTime.now().toUtc().toIso8601String(),
        'read_at': null,
        'is_local': true,
      });
      pendingIds.remove(download.id);
      changed = true;
    }
    if (changed) {
      if (rows.length > 100) rows.removeRange(100, rows.length);
      data['notifications'] = rows;
      data['tracked_download_ids'] = pendingIds.toList(growable: false);
      await _write(data);
    }
  });

  Future<void> clear() => _run(() => writeValue('{}'));

  Future<Map<String, dynamic>> _read() async {
    final raw = await readValue();
    if (raw == null || raw.isEmpty) return <String, dynamic>{};
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic>
          ? Map<String, dynamic>.from(decoded)
          : <String, dynamic>{};
    } on FormatException {
      return <String, dynamic>{};
    }
  }

  Future<void> _write(Map<String, dynamic> data) =>
      writeValue(jsonEncode(data));

  List<Map<String, dynamic>> _notifications(Map<String, dynamic> data) {
    final rows = data['notifications'];
    return rows is List
        ? rows
              .whereType<Map>()
              .map((row) => Map<String, dynamic>.from(row))
              .toList()
        : <Map<String, dynamic>>[];
  }

  List<int> _downloadIds(Map<String, dynamic> data) {
    final values = data['tracked_download_ids'];
    if (values is! List) return <int>[];
    return values
        .whereType<num>()
        .map((value) => value.toInt())
        .toSet()
        .toList();
  }

  String _newId() =>
      'local-${DateTime.now().microsecondsSinceEpoch}-${Random.secure().nextInt(1 << 32)}';

  Future<T> _run<T>(Future<T> Function() operation) {
    final result = _tail.then((_) => operation());
    _tail = result.then<void>((_) {}, onError: (Object _, StackTrace _) {});
    return result;
  }
}

class LocalDownloadResult {
  const LocalDownloadResult({
    required this.id,
    required this.title,
    required this.status,
    this.message,
  });

  final int id;
  final String title;
  final String status;
  final String? message;
}
