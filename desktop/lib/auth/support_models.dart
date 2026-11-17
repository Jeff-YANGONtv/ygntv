class SupportConversationSummary {
  const SupportConversationSummary({
    required this.publicToken,
    required this.status,
    required this.messagesCount,
    this.createdAt,
    this.lastMessageAt,
  });

  final String publicToken;
  final String status;
  final int messagesCount;
  final DateTime? createdAt;
  final DateTime? lastMessageAt;

  factory SupportConversationSummary.fromJson(Map<String, dynamic> json) =>
      SupportConversationSummary(
        publicToken: _supportString(json['public_token'] ?? json['token']),
        status: _supportString(json['status'], fallback: 'open'),
        messagesCount: _supportInt(json['messages_count']),
        createdAt: _supportDate(json['created_at']),
        lastMessageAt: _supportDate(json['last_message_at']),
      );
}

class SupportChatMessage {
  const SupportChatMessage({
    required this.id,
    required this.senderType,
    required this.body,
    this.attachmentUrl,
    this.attachmentName,
    this.createdAt,
  });

  final int id;
  final String senderType;
  final String body;
  final String? attachmentUrl;
  final String? attachmentName;
  final DateTime? createdAt;

  factory SupportChatMessage.fromJson(Map<String, dynamic> json) =>
      SupportChatMessage(
        id: _supportInt(json['id']),
        senderType: _supportString(json['sender_type'], fallback: 'visitor'),
        body: _supportString(json['body']),
        attachmentUrl: _supportNullableString(json['attachment_url']),
        attachmentName: _supportNullableString(json['attachment_name']),
        createdAt: _supportDate(json['created_at']),
      );
}

class SupportMessagesPage {
  const SupportMessagesPage({
    required this.publicToken,
    required this.status,
    required this.messages,
    required this.nextAfterId,
  });

  final String publicToken;
  final String status;
  final List<SupportChatMessage> messages;
  final int nextAfterId;

  factory SupportMessagesPage.fromJson(Map<String, dynamic> json) {
    final conversation = _supportMap(json['conversation']);
    final rawMessages = json['messages'];
    final messages = rawMessages is List
        ? rawMessages
              .whereType<Map>()
              .map(
                (row) =>
                    SupportChatMessage.fromJson(Map<String, dynamic>.from(row)),
              )
              .toList(growable: false)
        : const <SupportChatMessage>[];
    return SupportMessagesPage(
      publicToken: _supportString(
        conversation['public_token'] ?? conversation['token'],
      ),
      status: _supportString(conversation['status'], fallback: 'open'),
      messages: messages,
      nextAfterId: _supportInt(json['next_after_id']),
    );
  }
}

Map<String, dynamic> _supportMap(dynamic value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

String _supportString(dynamic value, {String fallback = ''}) {
  if (value == null) return fallback;
  final text = '$value'.trim();
  return text.isEmpty ? fallback : text;
}

String? _supportNullableString(dynamic value) {
  final text = _supportString(value);
  return text.isEmpty ? null : text;
}

int _supportInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse('$value') ?? 0;
}

DateTime? _supportDate(dynamic value) =>
    value is String ? DateTime.tryParse(value) : null;
