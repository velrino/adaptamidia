import 'package:flutter/services.dart';

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
      final keyCode = event.logicalKey.keyId;
      final keyName = RemoteControlService.getKeyName(keyCode);
      
      if (keyName != null) {
        return onRemoteKeyPressed(keyName, keyCode);
      }
    }
    return false;
  }

  // Método a ser implementado pelos widgets que usam este mixin
  bool onRemoteKeyPressed(String keyName, int keyCode);
}