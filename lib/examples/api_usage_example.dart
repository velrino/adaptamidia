import 'dart:io';
import '../services/auth_api_service.dart';
import '../services/logger_service.dart';
import '../models/device_config.dart';
import '../services/storage_service.dart';

/// Exemplo de como usar os serviços de API do SeeMidia
class ApiUsageExample {
  
  /// Exemplo básico de geração de código de autenticação
  static Future<void> basicAuthExample() async {
    try {
      // Gerar um ID único para o dispositivo (pode usar UUID, MAC address, etc.)
      final deviceId = await _getDeviceId();
      
      LoggerService.info('Iniciando autenticação para dispositivo: $deviceId');
      
      // Gerar código de autenticação
      final authData = await DeviceAuthManager.generateAuth(deviceId);
      
      if (authData != null) {
        LoggerService.info('Código gerado: ${authData.formattedCode}');
        LoggerService.info('QR Code: ${authData.qrCode.substring(0, 50)}...'); // Só os primeiros chars
        LoggerService.info('Expira em: ${authData.expiresIn}');
        
        // Mostrar o código para o usuário (implementar na UI)
        print('=== CÓDIGO DE AUTENTICAÇÃO ===');
        print('Dispositivo: $deviceId');
        print('Código: ${authData.formattedCode}');
        print('Expira em: ${authData.timeUntilExpiry.inMinutes} minutos');
        print('============================');
        
      } else {
        LoggerService.error('Falha ao gerar código de autenticação');
      }
    } catch (e) {
      LoggerService.error('Erro no exemplo básico', error: e);
    }
  }

  /// Exemplo completo com polling de status
  static Future<void> completeAuthFlowExample() async {
    try {
      final deviceId = await _getDeviceId();
      
      // Passo 1: Gerar código
      LoggerService.info('=== PASSO 1: Gerando código ===');
      final authData = await DeviceAuthManager.generateAuth(deviceId);
      
      if (authData == null) {
        LoggerService.error('Falha ao gerar código');
        return;
      }

      print('Código gerado: ${authData.formattedCode}');
      print('Use este código no app/website para autenticar');
      
      // Passo 2: Iniciar polling de status
      LoggerService.info('=== PASSO 2: Aguardando autenticação ===');
      
      await for (final status in DeviceAuthManager.pollAuthStatus(
        deviceId,
        interval: Duration(seconds: 3),
        timeout: Duration(minutes: 5),
      )) {
        LoggerService.info('Status: ${status.status}');
        
        if (status.isAuthenticated) {
          LoggerService.info('✅ Autenticado com sucesso!');
          LoggerService.info('Token: ${status.token?.substring(0, 20)}...');
          
          // Salvar token ou fazer outras ações necessárias
          await _handleSuccessfulAuth(status.token!);
          break;
          
        } else if (status.isExpired) {
          LoggerService.warning('❌ Código expirou');
          break;
          
        } else if (status.isRejected) {
          LoggerService.warning('❌ Autenticação rejeitada');
          break;
          
        } else {
          print('⏳ Aguardando... (${status.status})');
        }
      }
      
    } catch (e) {
      LoggerService.error('Erro no fluxo completo', error: e);
    }
  }

  /// Simula obter ID único do dispositivo
  static Future<String> _getDeviceId() async {
    // Na implementação real, usar:
    // - device_info_plus para obter ID único
    // - MAC address
    // - UUID gerado e salvo localmente
    
    // Por agora, usar configuração salva ou gerar um simples
    final config = await StorageService.getDeviceConfig();
    if (config != null) {
      return '${config.deviceModel}_${config.configuredAt.millisecondsSinceEpoch}';
    }
    
    return 'device_${DateTime.now().millisecondsSinceEpoch}';
  }

  /// Manipula autenticação bem-sucedida
  static Future<void> _handleSuccessfulAuth(String token) async {
    try {
      // Validar token
      final validation = await AuthApiService.validateToken(token);
      
      if (validation.success) {
        LoggerService.info('Token validado com sucesso');
        
        // Salvar token localmente para uso futuro
        // await StorageService.saveAuthToken(token);
        
        // Iniciar próximas etapas da aplicação
        LoggerService.info('Dispositivo pronto para uso!');
        
      } else {
        LoggerService.warning('Token inválido: ${validation.error}');
      }
      
    } catch (e) {
      LoggerService.error('Erro ao validar token', error: e);
    }
  }

  /// Exemplo de tratamento de erros
  static Future<void> errorHandlingExample() async {
    try {
      // Simular diferentes tipos de erro
      LoggerService.info('=== TESTE DE TRATAMENTO DE ERROS ===');
      
      // 1. Erro de conexão (servidor offline)
      LoggerService.info('Testando erro de conexão...');
      final result1 = await AuthApiService.generateDeviceAuth('test_device');
      
      if (!result1.success) {
        LoggerService.warning('Erro esperado: ${result1.error}');
      }
      
      // 2. Erro de timeout
      LoggerService.info('Testando outros cenários...');
      
    } catch (e) {
      LoggerService.error('Erro capturado no exemplo', error: e);
      
      // Mostrar mensagem amigável para o usuário
      if (e.toString().contains('conexão')) {
        print('❌ Sem conexão com a internet');
      } else if (e.toString().contains('timeout')) {
        print('❌ Servidor demorou muito para responder');
      } else {
        print('❌ Erro inesperado');
      }
    }
  }

  /// Executa todos os exemplos
  static Future<void> runAllExamples() async {
    LoggerService.setDebugMode(true);
    LoggerService.setAppName('SeeMidia-Example');
    
    LoggerService.info('🚀 Iniciando exemplos de uso da API');
    
    print('\n1. Exemplo básico:');
    await basicAuthExample();
    
    print('\n2. Tratamento de erros:');
    await errorHandlingExample();
    
    print('\n3. Fluxo completo (descomente para testar):');
    // await completeAuthFlowExample();
    
    LoggerService.info('✅ Exemplos concluídos');
  }
}

/// Para testar, descomente e execute:
/// void main() async {
///   await ApiUsageExample.runAllExamples();
/// }