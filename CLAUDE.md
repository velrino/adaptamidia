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
- [x] Sistema de autenticação QR Code com Firebase
- [x] Listagem de unidades em estilo Netflix (horizontal scroll)
- [x] **SISTEMA DE DISPLAY MEDIA COMPLETO** ⭐
  - [x] Player fullscreen 16:9 com modo imersivo
  - [x] Reprodução de vídeos MP4 (anúncios) com autoplay sem áudio
  - [x] Exibição de imagens (notícias) com cache inteligente
  - [x] Sistema de timing: News (5s), Ads (campo `seconds` da API)
  - [x] Barra de progresso minimalista
  - [x] Auto-cycling infinito entre conteúdos
  - [x] Integração com API `/display/unit/{id}` com autenticação
  - [x] Sistema de logging para tracking de conteúdo

## Funcionalidades a Implementar

- [ ] Salvar se esta usando landscape/portait
- [ ] Login e Logout do device
- [x] Player de mídia (slideshow de imagens/vídeos) - ✅ COMPLETO
- [ ] Integração com webcam USB
- [ ] Sistema de captura de fotos automatizada
- [ ] Cliente HTTP para upload de imagens
- [ ] Download automático de conteúdo do servidor
- [ ] Sistema de logs e monitoramento
- [ ] Configuração de intervalos de captura
- [ ] Controle de tela sempre ligada (wakelock)
- [ ] Gestão de armazenamento local
- [ ] Sistema de retry para uploads falhos

## Dependências Flutter Implementadas

```yaml
dependencies:
  # Core Flutter
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  
  # Networking & Storage
  http: ^1.1.0 # Requests HTTP
  shared_preferences: ^2.2.2 # Storage local
  
  # Firebase (Autenticação)
  firebase_core: ^3.6.0
  firebase_database: ^11.1.4
  
  # Media Player ⭐
  video_player: ^2.9.1 # Reprodução de vídeos MP4
  cached_network_image: ^3.4.1 # Cache inteligente de imagens
  
  # Utilities
  device_info_plus: ^10.1.2
  crypto: ^3.0.5
```

## Dependências Futuras (ainda não implementadas)

```yaml
dependencies:
  camera: ^0.10.5 # Câmera básica
  usb_camera: ^0.1.0 # Webcam USB específica
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

## ⭐ SISTEMA DE DISPLAY MEDIA - CORE DA SEEMIDIA

### 📋 Resumo Executivo

**O que é**: Sistema de exibição fullscreen de mídia (imagens de notícias e vídeos publicitários) em tablets comerciais 24/7.

**Implementação Completa**:
- ✅ Player fullscreen imersivo (sem barras do sistema)
- ✅ Suporte para NEWS (imagens, 5s) e ADVERTISEMENTS (vídeos MP4, tempo variável)
- ✅ Overlay elegante com título, descrição, fonte e autor para notícias
- ✅ Vídeos sem som com autoplay
- ✅ Progress bar minimalista
- ✅ Auto-cycling infinito
- ✅ Background sempre preto
- ✅ Adaptativo para qualquer resolução/orientação
- ✅ Sistema de logging para tracking
- ✅ Otimizado para Android 10+

### Arquitetura do Player

O sistema de display é o **CORAÇÃO** da aplicação SeeMidia. Funciona 24/7 exibindo conteúdo em tablets comerciais.

#### Arquivos Principais:
- `lib/interfaces/display_unit.dart` - Interfaces para API de display
- `lib/services/display_service.dart` - Service para buscar conteúdo e logging  
- `lib/screens/authenticated/display_screen.dart` - Player fullscreen

#### Como Funciona:

1. **Navegação**: Clique na unidade → `/display/{unit_id}`
2. **API Call**: `GET /display/unit/{id}` com Bearer token
3. **Parsing**: Converte resposta em `DisplayUnit` com lista de `DisplayContent`
4. **Player**: Exibe fullscreen com auto-cycling infinito

#### Tipos de Conteúdo:

```dart
// NEWS (Notícias - exibem imagens)
{
  "type": "NEWS",
  "news": {
    "image": "https://image-url.jpg",    // ← IMAGEM (não é url!)
    "title": "Título da notícia",
    "description": "Descrição...",
    "source_name": "Metropoles.com",     // ← Fonte
    "author": "Nome do Autor",           // ← Autor
    "status": "ACTIVE"
  }
  // Duração: SEMPRE 5 segundos fixo
}

// ADVERTISEMENT (Anúncios - exibem vídeos MP4)
{
  "type": "ADVERTISEMENT", 
  "ads": {
    "source": "https://video-url.mp4",   // ← Vídeo MP4
    "title": "Nome do anúncio",
    "seconds": 30,                       // ← Duração customizada (10s, 30s, etc)
    "status": "ACTIVE"
  }
}
```

#### Características Técnicas IMPLEMENTADAS:

##### 🎬 Display Fullscreen
- **Modo Imersivo**: `SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive)` - Remove barras do sistema
- **Background Preto**: SEMPRE preto em todos os estados (loading, error, empty, playing)
- **Aspect Ratio Livre**: Adapta para QUALQUER tela (não força 16:9)
- **FittedBox**: `BoxFit.cover` para vídeos e imagens preencherem 100% da tela

##### 🖼️ Sistema de Imagens (NEWS)
- **Widget**: `CachedNetworkImage` com cache inteligente
- **Fit**: `BoxFit.cover` - preenche toda a tela
- **Overlay de Texto**: Gradient preto na parte inferior com informações
- **Campos Exibidos**:
  - Título: 48px bold (até 3 linhas)
  - Descrição: 24px (até 3 linhas)
  - Fonte • Autor: 20px (bottom)
- **Padding**: 60px lateral, 120px superior, 60px inferior
- **Fallback**: Tela preta quando imagem falha

##### 🎥 Sistema de Vídeos (ADVERTISEMENT)
- **Widget**: `VideoPlayer` com configurações otimizadas
- **Sem Áudio**: `setVolume(0.0)` ANTES da inicialização
- **Autoplay**: Inicia automaticamente após inicialização
- **Sem Loop**: Cada vídeo toca uma vez por ciclo
- **Fullscreen**: `FittedBox` com `BoxFit.cover`
- **Dispose Otimizado**: Pause → Volume 0 → Wait → Dispose

##### ⏱️ Sistema de Timing
- **News**: 5 segundos FIXO (hardcoded)
- **Ads**: Campo `seconds` da API (10s, 30s, etc)
- **Progress Bar**: Atualiza a cada 100ms
- **Auto-cycling**: Infinito através da lista de conteúdos
- **Delays**:
  - 200ms entre dispose e novo vídeo
  - 100ms antes de iniciar playback
  - 200ms wait se ainda bufferizando

##### 🔧 Otimizações de Performance
- **Mount Checks**: Verifica `mounted` em todos pontos críticos
- **Timer Cleanup**: Cancela timers se widget não montado
- **Error Handling**: Try/catch em dispose e inicialização
- **Memory Management**:
  - Remove cache limits nas imagens (eram 1920x1080)
  - Dispose adequado de video controllers
  - Null safety em todas operações
- **Codec Prevention**:
  - `mixWithOthers: false`
  - `setVolume(0.0)` antes de inicializar
  - Headers `Connection: keep-alive`

#### 📊 Logging de Conteúdo:
```dart
DisplayService.instance.logContentCompletion(
  unitId: "unit_id",
  contentId: "content_id", 
  contentType: "NEWS|ADVERTISEMENT",
  contentTitle: "título",
  displayDuration: segundos,
  startTime: inicio,
  endTime: fim
);
// Atualmente só faz log local, futuramente enviará para servidor
```

### 🎯 Estados do Player:
1. **Loading** - Tela preta silenciosa
2. **Error** - Tela preta (tap anywhere para retry)
3. **Empty** - Tela preta 
4. **Playing** - Conteúdo fullscreen com progress bar branca no bottom

### 🔄 Fluxo de Navegação:
- **Entrada**: 
  - HomeScreen → Lista unidades estilo Netflix
  - Clique na unidade → Navigate para `/display/{unit_id}`
  - DisplayScreen abre em fullscreen imersivo
- **Saída**: 
  - Gesture/Back button → Retorna para HomeScreen
  - Sistema restaura barras do sistema
- **Loop de Conteúdo**: 
  - Index 0 → 1 → 2 → ... → N → 0 (infinito)
  - Mix de NEWS (5s) e ADS (variável)

### 🐛 Problemas Resolvidos:
1. **Imagens não apareciam**: Campo correto é `news.image` não `news.url`
2. **Vídeos não fullscreen**: Implementado `FittedBox` com `BoxFit.cover`
3. **Background verde**: Forçado preto em todos os estados
4. **Buffer overflow**: Dispose otimizado e delays adequados
5. **Codec AAC logs**: Volume 0 antes de inicializar previne codec de áudio
6. **Memory leaks**: Mount checks e cleanup adequado de timers
7. **Texto muito pequeno**: Fontes aumentadas (48px/24px/20px)
8. **Aspect ratio fixo**: Removido limite 16:9, adapta para qualquer tela

### 📱 Configuração de Produção:
- **Tablet**: Android 10+ (testado em Signworld)
- **Orientação**: Landscape ou Portrait (configurável)
- **Modo**: Fullscreen imersivo 24/7
- **Performance**: Otimizado para rodar dias sem reiniciar
- **Network**: Suporta reconexão automática

**💡 IMPORTANTE**: Este sistema é a essência do SeeMidia - tablets em estabelecimentos comerciais exibindo conteúdo publicitário e informativo 24/7 sem intervenção humana.
