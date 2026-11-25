import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

class RemoteControlService {
  static const Map<int, String> _keyCodeMap = {
    // D-Pad Navigation
    0x0013: 'DPAD_UP',
    0x0014: 'DPAD_DOWN', 
    0x0015: 'DPAD_LEFT',
    0x0016: 'DPAD_RIGHT',
    0x0017: 'DPAD_CENTER', // OK/Select button
    
    // Media Controls
    0x0055: 'MEDIA_PLAY_PAUSE',
    0x0056: 'MEDIA_STOP',
    0x0057: 'MEDIA_NEXT',
    0x0058: 'MEDIA_PREVIOUS',
    
    // Navigation
    0x0004: 'BACK',
    0x0052: 'MENU',
    0x0003: 'HOME',
    
    // Numbers
    0x0007: 'NUMBER_0',
    0x0008: 'NUMBER_1',
    0x0009: 'NUMBER_2',
    0x000A: 'NUMBER_3',
    0x000B: 'NUMBER_4',
    0x000C: 'NUMBER_5',
    0x000D: 'NUMBER_6',
    0x000E: 'NUMBER_7',
    0x000F: 'NUMBER_8',
    0x0010: 'NUMBER_9',
    
    // Volume
    0x0018: 'VOLUME_UP',
    0x0019: 'VOLUME_DOWN',
    0x001A: 'VOLUME_MUTE',
    
    // Channel
    0x00A6: 'CHANNEL_UP',
    0x00A7: 'CHANNEL_DOWN',
  };

  static String? getKeyName(int keyCode) {
    return _keyCodeMap[keyCode];
  }

  // Derive a friendly key name from a RawKeyEvent, preferring Android keyCode on Android.
  static String? keyNameFromEvent(RawKeyEvent event) {
    // Android: use platform keyCode reliably for remotes
    final data = event.data;
    if (data is RawKeyEventDataAndroid) {
      final code = data.keyCode;
      final mapped = _keyCodeMap[code];
      if (mapped != null) return mapped;
    }

    // Fallback: use logical keys (works on desktop/web and some Android remotes)
    final lk = event.logicalKey;
    if (lk == LogicalKeyboardKey.arrowUp) return 'DPAD_UP';
    if (lk == LogicalKeyboardKey.arrowDown) return 'DPAD_DOWN';
    if (lk == LogicalKeyboardKey.arrowLeft) return 'DPAD_LEFT';
    if (lk == LogicalKeyboardKey.arrowRight) return 'DPAD_RIGHT';
    if (lk == LogicalKeyboardKey.select || lk == LogicalKeyboardKey.enter || lk == LogicalKeyboardKey.numpadEnter) return 'DPAD_CENTER';
    if (lk == LogicalKeyboardKey.escape || lk == LogicalKeyboardKey.goBack) return 'BACK';

    // Number keys
    if (lk == LogicalKeyboardKey.digit0 || lk == LogicalKeyboardKey.numpad0) return 'NUMBER_0';
    if (lk == LogicalKeyboardKey.digit1 || lk == LogicalKeyboardKey.numpad1) return 'NUMBER_1';
    if (lk == LogicalKeyboardKey.digit2 || lk == LogicalKeyboardKey.numpad2) return 'NUMBER_2';
    if (lk == LogicalKeyboardKey.digit3 || lk == LogicalKeyboardKey.numpad3) return 'NUMBER_3';
    if (lk == LogicalKeyboardKey.digit4 || lk == LogicalKeyboardKey.numpad4) return 'NUMBER_4';
    if (lk == LogicalKeyboardKey.digit5 || lk == LogicalKeyboardKey.numpad5) return 'NUMBER_5';
    if (lk == LogicalKeyboardKey.digit6 || lk == LogicalKeyboardKey.numpad6) return 'NUMBER_6';
    if (lk == LogicalKeyboardKey.digit7 || lk == LogicalKeyboardKey.numpad7) return 'NUMBER_7';
    if (lk == LogicalKeyboardKey.digit8 || lk == LogicalKeyboardKey.numpad8) return 'NUMBER_8';
    if (lk == LogicalKeyboardKey.digit9 || lk == LogicalKeyboardKey.numpad9) return 'NUMBER_9';

    return null;
  }

  static bool isNavigationKey(int keyCode) {
    return [0x0013, 0x0014, 0x0015, 0x0016, 0x0017].contains(keyCode);
  }

  static bool isSelectKey(int keyCode) {
    return keyCode == 0x0017; // DPAD_CENTER
  }

  static bool isBackKey(int keyCode) {
    return keyCode == 0x0004; // BACK
  }

  static bool isMenuKey(int keyCode) {
    return keyCode == 0x0052; // MENU
  }

  static String getKeyDescription(int keyCode) {
    switch (keyCode) {
      case 0x0013:
        return 'Seta para Cima';
      case 0x0014:
        return 'Seta para Baixo';
      case 0x0015:
        return 'Seta para Esquerda';
      case 0x0016:
        return 'Seta para Direita';
      case 0x0017:
        return 'OK/Selecionar';
      case 0x0004:
        return 'Voltar';
      case 0x0052:
        return 'Menu';
      default:
        return 'Tecla ${keyCode.toRadixString(16).toUpperCase()}';
    }
  }
}

// Mixin para facilitar o uso em widgets
mixin RemoteControlMixin {
  bool handleRemoteKeyPress(RawKeyEvent event) {
    if (event is RawKeyDownEvent) {
      final keyName = RemoteControlService.keyNameFromEvent(event);
      
      if (keyName != null) {
        // Provide a synthetic keyCode when not available
        final maybeAndroid = event.data is RawKeyEventDataAndroid
            ? (event.data as RawKeyEventDataAndroid).keyCode
            : event.logicalKey.keyId;
        return onRemoteKeyPressed(keyName, maybeAndroid);
      }
    }
    return false;
  }

  // Método a ser implementado pelos widgets que usam este mixin
  bool onRemoteKeyPressed(String keyName, int keyCode);
}
