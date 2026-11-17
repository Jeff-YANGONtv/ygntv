# YGNTV Windows Desktop Preview

A standalone Flutter Windows module inside the YGNTV repository. It reuses the current Customer app's catalog API client, media models, and brand assets while keeping the desktop presentation code separate from the mobile UI.

## Run and build on Windows 11

Install the Flutter SDK and Visual Studio 2022 with the **Desktop development with C++** workload, then run from this folder:

```powershell
flutter pub get
flutter run -d windows
flutter build windows --release
```

The release bundle is written under `build\windows\x64\runner\Release`. It includes the app executable, Flutter engine, plugins, and app data; share the full folder as a ZIP, not just the `.exe`. The default window is 1120×630 and was sized for the ThinkPad's 1280×720 display.

## Preview scope

The first version is browse-first: Home, Movie, Series, Search, Blog, public title details, Review/Watch/Download tabs, and the Episode Guide. It reads only public catalog endpoints. Embedded playback and downloads are explicitly unavailable in this preview; valid Telegram Watch links (`https://t.me/...` and `https://telegram.me/...`) remain available and open in the system browser/Telegram app. Membership options link to the existing YGNTV subscription page.

Sign-in and account changes are intentionally not enabled in this Windows preview. The current YGNTV API validates device platforms as Android/TV values and does not accept `windows_desktop`; this module does not mislabel a Windows device or change the live API. Google ML Kit OCR and the mobile `video_player` plugin also have no Windows implementation, so neither is included in the desktop package. Windows support for secure storage, device information, app links, and OAuth is available in the mobile plugin ecosystem, but account sign-in still needs an API platform allowlist change before it can be safely enabled.

No live website or API deployment is performed by this module.
