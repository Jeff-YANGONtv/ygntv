import 'package:flutter/material.dart';

import 'auth/auth_service.dart';
import 'desktop_app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(YgntvDesktopApp(service: AuthService()));
}
