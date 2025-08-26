# SeeMidia - Contexto do Projeto

SEMPRE SER PENSADO EM landscape e portait
LAYOUT Elegante e minimalista. Sempre pensando em dark e light mode

## Informações Básicas

- **Nome do projeto**: SeeMidia (https://seemidia.com/)
- **Plataforma**: Android apenas
- **Package**: com.seemidia.display
- **Framework**: Flutter
- **Tipo**: Aplicação de Display Digital para Estabelecimentos Comerciais

## Descrição do Sistema

O SeeMidia é uma plataforma de mídia digital que será instalada em tablets/displays de estabelecimentos comerciais em todo o país. O app funciona como um player de conteúdo que:

- **Exibe conteúdo continuamente (24/7)**:
  - Notícias em tempo real
  - Anúncios publicitários
  - Conteúdo promocional dos estabelecimentos
- **Sistema de monitoramento**:
  - Captura fotos via webcam USB em intervalos regulares
  - Envia imagens para servidor central para verificação de audiência
  - Comprova que o display está funcionando e sendo visualizado

## Estrutura do Projeto

- Tela inicial de seleção de orientação (Portrait/Landscape)
- Orientação forçada após seleção do usuário
- Player de mídia para slideshow contínuo
- Sistema de captura de webcam USB
- Cliente HTTP para comunicação com servidor

## Comandos Importantes

- **Rodar com hot reload**: `flutter run -d 192.168.1.14:5555`
- **Ver dispositivos**: `flutter devices`
- **Conectar ADB WiFi**: Use app WADB no tablet

## Configurações

- Package Android: `com.seemidia.display`
- Arquivo principal: `lib/main.dart`
- MainActivity: `android/app/src/main/kotlin/com/seemidia/display/MainActivity.kt`
- Tablet usado: Signworld Android 10 (IP: 192.168.1.14)

## Funcionalidades Implementadas

- [x] Tela de seleção de orientação
- [x] Navegação para tela principal com orientação fixa
- [x] Package name configurado
- [x] Ambiente de desenvolvimento configurado (ADB WiFi)

## Funcionalidades a Implementar

- [ ] Salvar se esta usando landscape/portait
- [ ] Login e Logout do device
- [ ] Player de mídia (slideshow de imagens/vídeos)
- [ ] Integração com webcam USB
- [ ] Sistema de captura de fotos automatizada
- [ ] Cliente HTTP para upload de imagens
- [ ] Download automático de conteúdo do servidor
- [ ] Sistema de logs e monitoramento
- [ ] Configuração de intervalos de captura
- [ ] Controle de tela sempre ligada (wakelock)
- [ ] Gestão de armazenamento local
- [ ] Sistema de retry para uploads falhos

## Dependências Flutter Necessárias

```yaml
dependencies:
  camera: ^0.10.5 # Câmera básica
  usb_camera: ^0.1.0 # Webcam USB específica
  http: ^1.1.0 # Requests HTTP
  wakelock: ^0.6.2 # Tela sempre ligada
  path_provider: ^2.1.1 # Diretórios do sistema
  permission_handler: ^11.0.1 # Permissões
  connectivity_plus: ^5.0.1 # Verificar conexão
```

## Ambiente de Desenvolvimento

- **Tablet**: Signworld com Android 10
- **Conectividade**: ADB WiFi via app WADB
- **IP do tablet**: 192.168.1.14:5555
- **Desenvolvimento**: macOS com Flutter

## Arquitetura do Sistema

1. **App Flutter** (este projeto) - Cliente que roda nos estabelecimentos
2. **Servidor SeeMidia** - Backend que gerencia conteúdo e recebe fotos
3. **Dashboard Web** - Interface administrativa para clientes

## Considerações Técnicas

- App deve ser extremamente estável (24/7)
- Baixo consumo de recursos
- Recuperação automática de erros
- Logs detalhados para debugging remoto
- Atualizações automáticas de conteúdo
- Backup local para funcionamento offline

## Padrões de Código

### Interfaces e Tipagem
- **SEMPRE usar interfaces** em vez de `Map<String, dynamic>` para dados estruturados
- Criar interfaces na pasta `lib/interfaces/` com padrão TypeScript-like
- Usar `abstract class` para definir contratos (interfaces)
- Implementar classes concretas que seguem as interfaces

### Exemplo de Interface:
```dart
// lib/interfaces/auth_data.dart
abstract class IAuthResponse {
  String get accessToken;
  String get id;
  // ... outros campos
  
  Map<String, dynamic> toJson();
  factory IAuthResponse.fromJson(Map<String, dynamic> json) = AuthResponse.fromJson;
}

class AuthResponse implements IAuthResponse {
  @override
  final String accessToken;
  // ... implementação
}
```

### Serviços Isolados
- **Serviços devem ser reutilizáveis** e isolados
- Usar padrão Singleton com `static instance`
- Separar lógica de negócio das telas
- Exemplos:
  - `AuthSuccessService` - Para lidar com sucesso de autenticação
  - `ConfigurationService` - Para modal de configurações reutilizável

### Estrutura de Arquivos
```
lib/
├── interfaces/     # Contratos/interfaces TypeScript-like
├── models/         # Modelos de dados
├── services/       # Lógica de negócio isolada e reutilizável
├── screens/        # Telas da aplicação
└── utils/          # Utilitários gerais
```

### Boas Práticas
- Sempre verificar `context.mounted` antes de usar `BuildContext` em async
- Usar `?.toString()` para conversões seguras de tipos dinâmicos
- Validar tipos com `is` antes de casting
- Serviços devem retornar interfaces, não implementações concretas
