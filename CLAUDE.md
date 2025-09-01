# SeeMidia - Contexto do Projeto

> Nota rápida: veja também a seção “Notas Importantes (Agosto/2025)” para detalhes críticos de configuração Android (câmera UVC), cache do Firebase RTDB e logs de exibição.

SEMPRE SER PENSADO EM landscape e portait
LAYOUT Elegante e minimalista. Sempre pensando em dark e light mode

## Informações Básicas

- **Nome do projeto**: SeeMidia (https://seemidia.com/)
- **Plataforma**: Android apenas
- **Package**: com.seemidia.display
- **Framework**: Flutter
- **Tipo**: Aplicação de Display Digital para Estabelecimentos Comerciais

### Changelog (Agosto/2025)
- Android/UVC: `targetSdk = 27` conforme docs do plugin `flutter_uvc_camera`; manifesto com intent-filter/meta-data USB e `device_filter.xml` conforme guia do pacote.
- Firebase RTDB: cache local ajustado para 20 MB (≤ 100 MB) e logs de diagnóstico no init.
- Logs de exibição: rastreamento detalhado de `_logCurrentDisplayFinished` e resultado das escritas no RTDB.
- UVC Global: novo `UvcCameraHost` (preview oculto 640×480) + `UvcCameraService` mantém a câmera aberta app-wide com debounce/mutex e backoff (evita err=-99/libusb thrash).
- Detecção: `BackgroundDetectionService` com fila persistente em disco (`pending_detections/`), recuperação no boot, prioridade para ADs e limite de 30 itens (descarta NEWS primeiro).
- InsightFace: enriquecimento do log com `/detect-insightface` via multipart (arquivo + content-type correto), timeout 30s e fallback com `method` (timeout/http_XXX/error/invalid_response).
- LGPD: removido upload de fotos para Storage no fluxo do Display; apenas metadados (`people_count`, `insightface`) vão para o RTDB.
- Display logging: a gravação do log final agora vai para a API `POST /display/log/device` com Bearer (via `ApiService`), substituindo a escrita direta no RTDB para o fluxo primário.
- API centralizada: `lib/services/api_service.dart` centraliza `baseUrl` e wrappers `get/post/put/delete` (com timeout 30s e logging), e novas helpers `getUnit`, `getUnitInfo` removidas do `DisplayScreen`.
- Câmera como overlay: removida a tela dedicada (CameraScreen); exibir/ocultar câmera é feito via overlay global (Opacity) e opções na folha de Configuração; a `DisplayScreen` sempre esconde a câmera ao entrar.
- LGPD (fotos): ao copiar a foto do DCIM para pasta interna, o arquivo original do DCIM é apagado (e varremos resíduos antigos por padrão); após YOLO/InsightFace, a cópia interna é removida e o metadado do job é apagado.

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

- **Rodar no tablet**: `adb connect 192.168.1.14 && flutter run -d 192.168.1.14:5555`
- **Ver dispositivos**: `flutter devices`
- **Conectar ADB WiFi**: Use app WADB no tablet
- **Build APK debug**: `flutter build apk --debug`

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
  - [x] Player fullscreen UNIVERSAL (qualquer resolução/aspect ratio)
  - [x] Reprodução de vídeos MP4 (anúncios) com autoplay sem áudio
  - [x] Exibição de imagens (notícias) com cache inteligente
  - [x] Sistema de timing: News (5s), Ads (campo `seconds` da API)
  - [x] Barra de progresso minimalista
  - [x] Auto-cycling infinito entre conteúdos
  - [x] Integração com API `/display/unit/{id}` com autenticação
  - [x] Sistema de logging para tracking de conteúdo
  - [x] **FULLSCREEN GARANTIDO**: Funciona com qualquer dimensão (876×496, 1920×1080, etc)
- [x] **SISTEMA DE CACHE OFFLINE AVANÇADO** 🚀 **[NOVO - AGOSTO 2025]**
  - [x] **WebView + HTML5** substituiu VLC Player (muito mais estável)
  - [x] **Download automático** de vídeos MP4 do Google Cloud Storage
  - [x] **Cache inteligente** evita re-downloads duplicados
  - [x] **URLs normalizadas** funciona com/sem .mp4 na URL
  - [x] **Modo offline** funciona sem internet após downloads
  - [x] Exibição direta de arquivos locais (sem servidor HTTP local)
  - [x] **Portrait/Landscape** adaptativo: Portrait=crop, Landscape=contain
  - [x] **Performance otimizada** para tablets Android 10+ comerciais 24/7

## Funcionalidades a Implementar

- [ ] Salvar se esta usando landscape/portait
- [ ] Login e Logout do device
- [x] Player de mídia (slideshow de imagens/vídeos) - ✅ COMPLETO
- [x] Download automático de conteúdo do servidor - ✅ COMPLETO  
- [x] Gestão de armazenamento local - ✅ COMPLETO
- [ ] Integração com webcam USB
- [ ] Sistema de captura de fotos automatizada
- [ ] Cliente HTTP para upload de imagens
- [ ] Sistema de logs e monitoramento
- [ ] Configuração de intervalos de captura
- [ ] Controle de tela sempre ligada (wakelock)
- [ ] Sistema de retry para uploads falhos

## Dependências Flutter Implementadas

```yaml
dependencies:
  # Core Flutter
  flutter:
    sdk: flutter
  
  # Networking & Storage
  http: ^1.5.0 # Requests HTTP
  shared_preferences: ^2.2.2 # Storage local
  path_provider: ^2.1.1 # Diretórios do sistema
  path: ^1.9.1 # Manipulação de paths
  
  # Firebase (Autenticação)
  firebase_core: ^3.6.0
  firebase_database: ^11.1.4
  firebase_auth: ^5.3.1
  firebase_storage: ^12.3.4
  
  # Media Player NOVO ⭐ [AGOSTO 2025]
  webview_flutter: ^4.13.0 # WebView core
  webview_flutter_android: ^4.10.1 # Android WebView
  webview_flutter_wkwebview: ^3.23.0 # iOS WebView  
  cached_network_image: ^3.4.1 # Cache inteligente de imagens
  
  # Utilities
  device_info_plus: ^10.1.2
  crypto: ^3.0.5 # MD5 para cache keys
  wakelock_plus: ^1.2.8 # Tela sempre ligada
  image: ^4.5.4 # Processamento de imagens
  
  # YOLO & Camera (futuros)
  ultralytics_yolo: ^0.1.26
  flutter_uvc_camera: ^1.0.0
  connectivity_plus: ^6.0.5
  package_info_plus: ^8.0.2
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

---

## Notas Importantes (Agosto/2025)

Estas notas documentam ajustes críticos realizados para estabilidade do app em campo: integração de câmera UVC, limites do Firebase Realtime Database e rastreabilidade de logs.

### Android – Câmera UVC (flutter_uvc_camera)

- targetSdkVersion: definido como `27` em `android/app/build.gradle.kts`.
  - Motivo: a lib `flutter_uvc_camera` (baseada em AndroidUSBCamera) falha no fluxo de permissão USB quando o `targetSdk >= 31` (Android 12+) devido às mudanças de `PendingIntent` (IM/MUTABLE). Com `27`, o fluxo volta a funcionar (comprovado em produção).
  - Futuro: se for obrigatório subir `targetSdk`, será necessário patch no plugin Android para usar `PendingIntent` com flags corretas e revisar o BroadcastReceiver. Sugestão: adicionar `FLAG_IMMUTABLE` no `PendingIntent.getBroadcast` e garantir uso de `Context.registerReceiver`/`android:exported` conforme API 31+.

- Manifesto Android (`android/app/src/main/AndroidManifest.xml`):
  - Mantido o bloco conforme README do plugin, incluindo a permissão `android.permission.USB_PERMISSION` (mesmo não sendo uma permissão real do sistema, a doc do plugin a referencia) e o `intent-filter` + `meta-data` para USB:
    - `<action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />`
    - `<meta-data android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" android:resource="@xml/device_filter" />`
  - `uses-feature` incluído para `android.hardware.usb.host`.

- Filtro de dispositivos (`android/app/src/main/res/xml/device_filter.xml`):
  - Usamos a entrada de exemplo do plugin (VID/PID placeholders) para manter compatibilidade com a documentação do pacote.
  - Em produção, substitua por:
    - seus VID/PID reais (melhor compatibilidade), e/ou
    - um filtro genérico UVC via `<usb-interface class="14" />` para pegar câmeras UVC compatíveis.

### Firebase Realtime Database – Cache e Logs

- Limite de cache local: o SDK do RTDB não permite `setPersistenceCacheSizeBytes` > 100 MB.
  - Causa raiz: valores maiores causam exceção no cliente e falham todas as operações subsequentes (incluindo `.set()`), sem relação com câmera.
  - Ajuste: configurado para `20 MB` (seguro e dentro do limite) em `lib/services/firebase_service.dart`:
    - `setPersistenceEnabled(true)`
    - `setPersistenceCacheSizeBytes(20 * 1024 * 1024)`

- Diagnósticos adicionados:
  - `FirebaseService.initialize()` agora faz `debugPrint` do `projectId`, `appId` e `databaseURL` após `Firebase.initializeApp()`.
  - Em caso de falha ao ativar persistência/cache, registra a exceção e prossegue (não bloqueia app).

### Rastreamento de Exibição (DISPLAY_LOGS)

- Fluxo de logging:
  - O método `_logCurrentDisplayFinished()` é chamado:
    - ao trocar para o próximo conteúdo (`_nextContent()`), e
    - no `dispose()` da tela de display (garantia de último registro).
  - Só registra para `ADVERTISEMENT` e `NEWS` com `_id` válido.
  - Identificador do log: `captureId = DateTime.now().millisecondsSinceEpoch.toString()`.
  - Payload inclui: `identifier`, `id` (conteúdo), `local` (unit data), `type`, `status=FINISHED`, `start_at`, `end_at`, `device_id`, `device_context`.
  - Caminho no RTDB: `DISPLAY_LOGS/<identifier>`.

- Logs detalhados (para diagnóstico):
  - `lib/screens/authenticated/display_screen.dart`
    - Entradas quando o log é invocado, motivos de “skip”, IDs, timestamps e `deviceId`.
  - `lib/services/display_log_service.dart`
    - Antes/depois do `.set()` e, em caso de erro, imprime `FirebaseException.code/message` e stack trace.
  - `lib/services/firebase_service.dart`
    - Opções do app Firebase e status do RTDB.

- Verificações recomendadas se não aparecer no Firebase:
  - Conferir regras do RTDB para `DISPLAY_LOGS/*` (ex.: permitir escrita anônima, ou habilitar autenticação anônima no app e manter regras restritivas).
  - Validar `google-services.json` (package `com.seemidia.display` e projeto correto).
  - Garantir conectividade e hora do dispositivo corretas.

### Captura de Foto + Processamento (LGPD) — Atualizado

- Objetivo: ao finalizar cada exibição (NEWS/ADVERTISEMENT), capturar uma foto da câmera UVC e anexar METADADOS ao log (`DISPLAY_LOGS`). Nenhuma foto é enviada a servidor/Storage.

- UVC Global (host + serviço):
  - `lib/components/uvc_camera_host.dart`: preview oculto 640×480 com `UVCCameraView` no topo da árvore via `MaterialApp.builder` (mantém contexto GL).
  - `lib/services/uvc_camera_service.dart`: mantém a câmera aberta app-wide, com mutex de abertura e backoff (3s→10s) em falhas; expõe `takePicture()`.
  - Telas (`DisplayScreen`/`CameraScreen`): apenas chamam `UvcCameraService.instance.takePicture(640×480)` quando precisam.

- Fluxo resumido (LGPD):
  1) `_logCurrentDisplayFinished()` é chamado na transição e no `dispose()` da tela.
  2) `UvcCameraService.takePicture()` salva arquivo (o plugin grava em DCIM; o serviço de background persiste para pasta interna do app) e enfileira job.
  3) `BackgroundDetectionService` processa em segundo plano: roda YOLO para `people_count` e chama InsightFace para enriquecer `insightface`.
  4) Log final vai para a API `POST /display/log/device` (Bearer obrigatório) e APAGAMOS a foto local e o JSON do job (LGPD). O RTDB permanece como utilitário/apoio (opcional).

- Enriquecimento InsightFace:
  - Endpoint: `POST https://vision-2057331207.us-central1.run.app/detect-insightface`
  - Envio: `multipart/form-data` com campo `file` via `MultipartFile.fromPath`, `filename` real e `content-type` coerente (`image/jpeg|png|webp`).
  - Timeout: 30 segundos (envio e leitura).
  - Resposta esperada:
    ```json
    {
      "gender": {"Woman": 4, "Man": 4},
      "men": 4, "women": 4, "total": 8,
      "age": {"max": 59, "min": 27, "average": 39},
      "method": "InsightFace"
    }
    ```
  - Fallbacks automáticos (sempre incluem `method`):
    - Timeout → `method: "timeout"` com todos zeros.
    - HTTP não‑2xx → `method: "http_<status>"` com zeros.
    - Resposta inválida → `method: "invalid_response"` com zeros.
    - Erro genérico → `method: "error"` com zeros.
    - `people_count == 0` → objeto zerado (sem necessidade de chamada remota).

- Fila persistente de detecção:
  - Persistência: jobs salvos em `app_docs/pending_detections/` com foto em `photos/` + JSON `<captureId>.json`.
  - Recuperação: `ensureLoaded()` revarre pendências no boot, carrega ADs primeiro e reinicia o processamento.
  - Prioridade/limite: ADVERTISEMENTS entram na frente quando fila ≥ 10; limite duro de 30, descartando NEWS primeiro. Ao descartar, apaga foto + JSON.
  - Limpeza: após processar/logar, apaga foto + JSON (LGPD).
  - Varredura DCIM: após copiar a foto para a pasta interna, removemos o arquivo original em DCIM e varremos resíduos com padrão `IMG_<timestamp>.jpg` (espera ≥ 60s para não conflitar com MediaScanner).

- Dependências:
  - `http_parser: ^4.0.2` e `path` para multipart com `content-type` correto.
  - `http: ^1.5.0` já presente.

### YOLO + Câmera (contexto)

- YOLO (`ultralytics_yolo`) carrega o modelo TFLite de `assets/models/yolo11n.tflite` para diretório temporário e roda detecção sob demanda na imagem capturada.
- A prévia da câmera (UVC) é independente do RTDB; quedas de frames ou operações de preview não interferem nas escritas do Firebase.

### YOLO em Background + LGPD (Agosto/2025)

- Objetivo: não impactar o ciclo de exibição e cumprir a LGPD.
- Implementação:
  - `BackgroundDetectionService`:
    - `ensureLoaded()`: carrega `ultralytics_yolo: ^0.1.36` uma vez a partir de `assets/models/yolo11n.tflite` (copiado para o tmp) e mantém instância viva.
    - `enqueue(...)`: salva job+foto no disco, aplica prioridade/limite, processa sequencialmente (`people_count`, InsightFace, log RTDB) e apaga artefatos.
  - `DisplayScreen`: usa `UvcCameraService.takePicture()` e enfileira; modelo é pré-aquecido com `ensureLoaded()` assíncrono.
  - Upload de fotos: desabilitado; somente metadados (`people_count`, `insightface`) são gravados (LGPD).
- Política da câmera (global):
  - UVC permanece aberta no app inteiro (host global). `UvcCameraService` controla abertura única e reabertura com backoff (evita err=-99/libusb).
  - Preview oculto fixo 640×480 para satisfazer o plugin; capturas ocorrem sob demanda.
  - Overlay visível/oculto: controlado por `UvcCameraService.previewVisible` (ValueNotifier) e alternado via Configurações.
  - A `DisplayScreen` chama `hidePreview()` ao entrar, garantindo que o público nunca veja a câmera.

### Observabilidade (Android)

- Crashlytics (release): coletamos erros e adicionamos `device_id` como custom key.
- Performance (release):
  - Trace `prepare_assets` (pré‑carregamento de mídia).
  - Trace `bd_job` (processamento de captura): métricas `yolo_ms`, `insight_ms`, `log_ms` e atributos `capture_id`, `type`, `people_count`.
  - HTTP metrics: `ApiService` usa `HttpMetric` (latência e status das chamadas GET/POST/PUT/DELETE).

### UI – Configuração e Controles de Câmera (Atualizado)

- Configurações do Display (bottom sheet):
  - Exibir Câmera USB: liga overlay (opacity=1) e fecha a folha.
  - Ocultar Câmera USB: desliga overlay (opacity=0) e fecha a folha.
  - Ao abrir o sheet, escondemos o overlay para cobrir tudo; ao sair, restauramos o estado anterior se o usuário não mudou explicitamente.
- Overlay técnico:
  - Host: `lib/components/uvc_camera_host.dart` usa `ValueListenableBuilder` para aplicar `opacity`.
  - Serviço: `lib/services/uvc_camera_service.dart` expõe `showPreview()/hidePreview()/togglePreview()` e mantém a câmera aberta (sem “thrash”).

### Display – Durações e Captura

- NEWS: duração padrão 10 segundos (comentado no código para lembrar).
- ADVERTISEMENT: duração vem da API (`seconds`).
- Captura: 1 `takePicture` no fim de cada conteúdo (NEWS e AD). Sem cooldown extra.

### Logs – API Service

- `lib/services/api_service.dart`:
  - BaseUrl centralizada; métodos `get/post/put/delete` com timeout (30s) e logs (LoggerService).
  - Chamadas no `DisplayScreen` para `/display/unit/:id` e `/display/unit/:id/info` foram movidas para o service.
  - Endpoint de logs: `POST /display/log/device` com Bearer.
- Dependências:
  - Atualizado `ultralytics_yolo` para `^0.1.36`.
  - Modelo: `assets/models/yolo11n.tflite` listado no `pubspec.yaml`.

### Próximos Passos (se necessário)

- Elevar `targetSdk` mantendo câmera UVC:
  - Parchar o código nativo do `flutter_uvc_camera` adicionando flags de `PendingIntent` compatíveis com Android 12+ e revisando receptores/exported.
  - Após patch, restaurar `targetSdk` alto (ex.: 34) e revalidar fluxo de permissão.

- Regras RTDB + Autenticação:
  - Se desejar regras estritas, habilitar `firebase_auth` (ex.: Anonymous Auth no boot) e ajustar regras para `auth != null`.

Referências rápidas:
- `android/app/build.gradle.kts`: `targetSdk = 27`
- `android/app/src/main/AndroidManifest.xml`: USB intent-filter/meta-data
- `android/app/src/main/res/xml/device_filter.xml`: filtro USB
- `lib/services/firebase_service.dart`: init do Firebase + persistência RTDB
- `lib/services/display_log_service.dart`: escrita no RTDB (DISPLAY_LOGS)
- `lib/screens/authenticated/display_screen.dart`: gatilho de logs e ciclo de conteúdo

## Ambiente de Desenvolvimento

- **Tablet**: Signworld com Android 10
- **Conectividade**: ADB WiFi via app WADB
- **IP do tablet**: 192.168.1.14:5555
- **Desenvolvimento**: macOS com Flutter
- **Plataforma alvo**: Somente Android (hardware de fornecedores chineses); sem suporte iOS

## Operação em Dispositivos (Android‑only)

- Instalação/Atualização (sideload):
  - Build release: `flutter build apk --release`
  - Instalar: `adb install -r build/app/outputs/flutter-apk/app-release.apk` (USB/ADB Wi‑Fi/WADB)
  - Observação: `targetSdk = 27` por dependência do plugin UVC. Distribuição é interna (sem Play Store). Lint de `ExpiredTargetSdkVersion` desabilitado apenas para build interno.

- Autostart (recomendado):
  - App deve abrir sozinho após ligar o tablet (BOOT_COMPLETED). Caso necessário, adicionar receiver no Manifest com `RECEIVE_BOOT_COMPLETED` abrindo a `MainActivity`. (Não implementado por padrão; considerar em produção.)

- Operação 24/7:
  - Wakelock ativado pela `DisplayScreen` (mantém a tela ligada).
  - Desativar otimização de bateria para o app no Android (para evitar suspensões).
  - Manter o tablet na energia e com brilho conforme ambiente.

- Modo Kiosk (opcional):
  - Se necessário, travar o tablet no app (launcher customizado) ou usar app kiosk (Fully Kiosk, SureLock). Não obrigatório para operação básica.

- Observabilidade em release:
  - Crashlytics: coleta crashes e erros (com `device_id`).
  - Performance: traces `prepare_assets`, `bd_job` e métricas HTTP no `ApiService`.

- Câmera (UVC):
  - Overlay controlado pelo menu de Configuração (Exibir/Ocultar). Oculto automaticamente ao entrar na `DisplayScreen`.
  - Capturas são locais e apagadas após processamento (LGPD). Nada é salvo no servidor.

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
- ✅ **FULLSCREEN UNIVERSAL**: Qualquer dimensão de vídeo/imagem (876×496, 1920×1080, etc)
- ✅ Sistema de logging para tracking
- ✅ Otimizado para Android 10+

### 🔒 Offline‑First e Sincronização (NOVO)

- ✅ Pré‑carregamento inicial: antes de começar a tocar, o app baixa todos os vídeos (MP4) e imagens da playlist atual.
- ✅ Exibe somente conteúdo garantido no disco: após o download, a playlist é filtrada para manter apenas itens 100% em cache.
- ✅ Overlay de preparação: tela de "Preparando conteúdo para modo offline..." com progresso combinado (imagens + vídeos).
- ✅ Sincronização em background: a cada 10 minutos, busca a playlist, baixa mídias novas e só então atualiza a lista em memória, sem interromper a reprodução atual.
- ✅ Limpeza automática de cache: remove mídias não referenciadas e com mais de 15 dias para evitar ocupar armazenamento.
- ✅ Execução 24/7: timers e controladores são sempre cancelados no dispose; UI permanece imersiva e com wakelock ativo.

Componentes envolvidos:
- `lib/screens/authenticated/display_screen.dart`
  - Fluxo: load → cleanup (15d) → preload (imagens+vídeos) → filtra offline → start → background sync 10min.
  - Overlay de preparação com `LinearProgressIndicator` enquanto baixa.
- `lib/services/video_cache_service.dart`
  - `preloadVideos(urls)`: baixa MP4s com verificação e evita duplicidades.
  - `getVideoFromCache(url)`: retorna `File` do cache local se existir.
  - `cleanupCache(keepUrls, maxAge: 15 dias)`: remove vídeos antigos não utilizados.
- `lib/services/image_cache_service.dart`
  - Baseado em `flutter_cache_manager`; mantém `manifest.json` com `lastSeen` por URL.
  - `preloadAll(urls)`: pré‑baixa imagens e persiste no cache de disco.
  - `isCached(url)`: checagem rápida de presença no cache.
  - `cleanupOld(keepUrls, maxAge: 15 dias)`: remove imagens obsoletas.

Resultados esperados:
- Primeira execução pode demorar mais (download inicial), mas depois roda offline.
- Novos conteúdos entram no ciclo apenas quando 100% baixados.
- Armazenamento controlado automaticamente (retenção de 15 dias).

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

##### 🎬 Display Fullscreen UNIVERSAL
- **Modo Imersivo**: `SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive)` - Remove barras do sistema
- **Background Preto**: SEMPRE preto em todos os estados (loading, error, empty, playing)
- **Solução Universal**: `FittedBox(fit: BoxFit.cover)` + `AspectRatio` garante fullscreen em QUALQUER dimensão
- **Testado**: Funciona com vídeos 876×496, 1920×1080, e qualquer outro tamanho
- **Sem Cálculos Complexos**: Solução simples e robusta que sempre funciona

##### 🖼️ Sistema de Imagens (NEWS) - OVERLAY UNIFICADO ELEGANTE ⭐
- **Widget**: `CachedNetworkImage` com cache local (pré-carregado por `ImageCacheService`)
- **Fit**: `BoxFit.cover` - preenche toda a tela
- **Overlay Corporativo Unificado**: 
  - **Logo SeeMidia** à esquerda (200x200px) com shadow
  - **Linha divisória** elegante no centro
  - **Todos os textos** organizados à direita
- **Design Anti-Imagem Branca**:
  - Container único com gradient preto semi-transparente
  - Bordas arredondadas (20px) + box shadow profunda
  - Borda sutil branca para elegância extra
- **Campos Exibidos**:
  - Título: 36px bold branco (até 2 linhas)
  - Descrição: 20px cinza claro (até 2 linhas)  
  - Fonte • Autor: 16px com ícone (1 linha)
- **Layout Responsivo**: `IntrinsicHeight` + `Expanded` para adaptação automática
- **Posicionamento**: Bottom da tela com margem 24px
- **Branding**: Espaço dedicado à marca SeeMidia (lado esquerdo)

##### 🎥 Sistema de Vídeos (ADVERTISEMENT) - SOLUÇÃO UNIVERSAL
- **Camada Persistente (AdVideoLayer)**: layer global com dois controladores (active/standby), sempre presente e controlado por opacidade.
- **Crossfade**: quando o próximo anúncio já está pré‑carregado (standby), o layer faz crossfade suave (~250ms) entre vídeos.
- **Pré‑carregamento (double buffer)**: o próximo anúncio é inicializado no standby durante a reprodução do atual.
- **Origem**: arquivos de vídeo baixados por `VideoCacheService` (caminho local), controlados por `AdVideoLayer` (sem reconstruir player a cada troca).
- **Fullscreen Garantido**: Funciona com QUALQUER dimensão (876×496, 1920×1080, etc)
- **Sem Áudio**: `setVolume(0.0)` ANTES da inicialização
- **Autoplay**: Inicia automaticamente após inicialização
- **Sem Loop**: Cada vídeo toca uma vez por ciclo
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

##### 📦 Cache e Modo Offline (Atualizado)
- Pré-carregamento: após `/display/unit/{id}`, coletamos as URLs e baixamos tudo antes de iniciar o ciclo.
- Vídeos: baixados e servidos via arquivo local (`VideoCacheService.getVideoFromCache` + `VideoPlayerController.file`).
- Imagens: baixadas/armazenadas com `CachedNetworkImage` e utilitários de `ImageCacheService`.
- Filtro: exibimos apenas itens cuja mídia já está disponível localmente.
- Refresh em background: a cada 10 minutos, limpamos o que não será usado, baixamos novos e atualizamos a playlist sem travar a UI.
- Offline: após baixar, o player segue funcionando sem internet.
  
Notas de orientação em refresh:
- Para ADs, a seleção do arquivo leva em conta a orientação (`source_landscape`/`source_portrait`) tanto no pré‑carregamento quanto no filtro do refresh. Evita remoções indevidas de anúncios após sincronização.

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
8. **Vídeo 876×496 não fullscreen**: **SOLUÇÃO UNIVERSAL** com `FittedBox` + `AspectRatio`
9. **Cálculos complexos de aspect ratio**: Removida lógica complexa, solução simples e robusta

### 📱 Configuração de Produção:
- **Tablet**: Android 10+ (testado em Signworld)
- **Orientação**: Landscape ou Portrait (configurável)
- **Modo**: Fullscreen imersivo 24/7
- **Performance**: Otimizado para rodar dias sem reiniciar
- **Network**: Suporta reconexão automática

## 🎯 SOLUÇÃO FULLSCREEN UNIVERSAL - BREAKTHROUGH TÉCNICO

### 🔧 Implementação Final (Agosto 2025):

**Problema**: Vídeo 876×496 específico não ficava fullscreen, necessário solução que funcione com QUALQUER dimensão.

**Solução Implementada**:
```dart
// Para VÍDEOS - display_screen.dart linha ~385
Positioned.fill(
  child: FittedBox(
    fit: BoxFit.cover, // SEMPRE cover = fullscreen
    alignment: Alignment.center,
    child: AspectRatio(
      aspectRatio: videoSize.aspectRatio,
      child: VideoPlayer(_videoController!),
    ),
  ),
),

// Para IMAGENS - já estava correto
Positioned.fill(
  child: CachedNetworkImage(
    imageUrl: content.url,
    fit: BoxFit.cover, // Fullscreen garantido
    width: double.infinity,
    height: double.infinity,
  ),
),
```

### ✅ Resultados:
- **876×496**: ✅ Fullscreen
- **1920×1080**: ✅ Fullscreen  
- **Qualquer dimensão**: ✅ Fullscreen
- **Landscape/Portrait**: ✅ Fullscreen
- **Código limpo**: Removida lógica complexa de cálculos manuais

### 🔑 Conceitos Chave:
- `FittedBox(fit: BoxFit.cover)` = Sempre expande para cobrir 100% da área
- `AspectRatio` = Mantém proporção original do vídeo
- `Positioned.fill` = Ocupa todo o container pai
- Combinar os 3 = **Fullscreen universal garantido**

### 📋 Comando de Deploy:
```bash
adb connect 192.168.1.14 && flutter run -d 192.168.1.14:5555
```

**💡 IMPORTANTE**: Este sistema é a essência do SeeMidia - tablets em estabelecimentos comerciais exibindo conteúdo publicitário e informativo 24/7 sem intervenção humana.

---

## 🚀 BREAKTHROUGH TÉCNICO - AGOSTO 2025

### **MIGRAÇÃO VLC → WebView: PROBLEMA RESOLVIDO**

**Contexto**: Projeto descrito como "life-changing" pelo usuário enfrentou problemas críticos com VLC Player no Android 10:
- ❌ `LateInitializationError: Field '_viewId@1301035241' has not been initialized`
- ❌ Vídeos travando em loading infinito
- ❌ Crashes frequentes em tablets comerciais
- ❌ Incompatibilidade com Android 10

### **SOLUÇÃO IMPLEMENTADA: WebView + Sistema de Cache Offline**

**1. WebView + HTML5 Video**
- ✅ Substituição completa do VLC por WebView com HTML5 `<video>`
- ✅ AutoPlay + Loop nativos via JavaScript
- ✅ Muito mais estável que VLC em Android 10
- ✅ Fullscreen garantido: Portrait (crop) + Landscape (contain)

**2. Sistema de Cache Offline Inteligente**
```dart
// Arquivos criados:
lib/services/video_cache_service.dart    // Cache principal de vídeos MP4
lib/services/local_server.dart           // Servidor HTTP local
lib/components/video_player_screen.dart  // WebView player isolado
```

**3. Funcionalidades Avançadas Implementadas**
- 🎯 **URLs normalizadas**: `video` e `video.mp4` = mesmo arquivo cached
- 🔄 **Download inteligente**: MD5-based, evita duplicatas
- 📁 **Storage persistente**: `/app_flutter/seemidia_videos/`  
- 🌐 **Servidor HTTP local**: `http://127.0.0.1:8080/video/` 
- ⚡ **Performance**: Reprodução instantânea de vídeos cached
- 💾 **Modo offline**: Funciona sem internet após downloads

**4. Arquitetura Final**
```
Google Cloud Storage → VideoCacheService → Local HTTP Server → WebView
```

**5. Resultados Comprovados**
```
I/flutter: 💾 Vídeo encontrado em cache: /data/.../c078185e505b9dd3cd964608e60d4ed1.mp4
I/chromium: 🎬 Iniciando vídeo: http://127.0.0.1:8080/video/c078185e505b9dd3cd964608e60d4ed1.mp4
```

### **IMPACTO PARA SEEMIDIA**
- ✅ **Estabilidade 24/7**: Sistema robusto para tablets comerciais
- ✅ **Economia de banda**: Vídeos cached não consomem internet
- ✅ **Reprodução offline**: Funciona mesmo sem conectividade
- ✅ **Performance superior**: Vídeos locais = zero buffering
- ✅ **Compatibilidade total**: Android 10+ sem problemas

**Este breakthrough técnico garantiu a viabilidade do projeto life-changing do usuário!** 🎉

---

## 📋 DETALHAMENTO COMPLETO PARA MIGRAÇÃO REACT NATIVE

### 🏗️ ARQUITETURA FLUTTER IMPLEMENTADA

#### 📁 Estrutura de Pastas:
```
lib/
├── main.dart                          # Entry point + routing
├── interfaces/                        # Contratos TypeScript-like
│   ├── auth_data.dart                 # Interfaces de autenticação
│   └── display_unit.dart              # Interfaces do sistema de display
├── models/                            # Modelos de dados (não usado)  
├── services/                          # Business logic isolada
│   ├── api_service.dart               # HTTP client genérico
│   ├── auth_service.dart              # Autenticação QR Code
│   ├── display_service.dart           # Service do display media
│   ├── firebase_service.dart          # Integração Firebase
│   └── storage_service.dart           # SharedPreferences wrapper
├── screens/                           # Telas da aplicação
│   ├── configuration_screen.dart      # Modal configurações reutilizável
│   ├── login_screen.dart             # Tela de login QR Code
│   ├── authenticated/                 # Telas pós-autenticação
│   │   ├── home_screen.dart          # Lista unidades estilo Netflix
│   │   └── display_screen.dart       # ⭐ PLAYER FULLSCREEN CORE
└── utils/                            # Utilitários gerais (não usado)
```

#### 🔧 SERVICES IMPLEMENTADOS:

##### **ApiService** - HTTP Client Universal
```dart
class ApiService {
  static String baseUrl = 'https://api.seemidia.com/v1';
  
  // GET genérico com tipo de retorno
  static Future<ApiResponse<T>> get<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson,
    {Map<String, String>? headers}
  );
  
  // POST genérico  
  static Future<ApiResponse<T>> post<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
    {Map<String, String>? headers}
  );
}
```

##### **AuthService** - QR Code + Firebase
```dart
class AuthService {
  // Login via QR Code → Firebase
  Future<IAuthResponse?> authenticateWithQRCode(String qrCodeData);
  
  // Refresh token automático
  Future<String?> refreshToken(String currentToken);
  
  // Logout limpa storage
  Future<void> logout();
}
```

##### **DisplayService** - Core do Sistema
```dart  
class DisplayService {
  // Busca conteúdo de uma unidade específica
  Future<IDisplayUnit?> getDisplayUnit(String unitId);
  
  // Log de tracking (futuro envio ao servidor)
  void logContentCompletion({
    required String unitId,
    required String contentId,
    required String contentType,
    required String contentTitle,
    required int displayDuration,
    required DateTime startTime,
    required DateTime endTime,
  });
}
```

##### **StorageService** - Persistência Local
```dart
class StorageService {
  // Auth token
  static Future<String?> getAuthToken();
  static Future<void> setAuthToken(String token);
  
  // User data
  static Future<Map<String, dynamic>?> getUserData();
  static Future<void> setUserData(Map<String, dynamic> data);
  
  // Orientation preference (futuro)
  static Future<String?> getOrientation();
  static Future<void> setOrientation(String orientation);
}
```

#### 🎮 TELAS IMPLEMENTADAS:

##### **LoginScreen** - QR Code Scanner
- Scanner QR Code nativo com preview
- Validação de QR Code via regex
- Auto-login se token válido existe
- Feedback visual de erro/sucesso
- Navegação automática para HomeScreen

##### **HomeScreen** - Lista de Unidades Netflix-Style  
- Scroll horizontal de unidades
- Cards com imagem, nome, e status
- Loading states elegantes
- Pull-to-refresh
- Navegação para `/display/{unitId}` 
- Logout button no top

##### **DisplayScreen** - ⭐ PLAYER FULLSCREEN CORE
**O coração do sistema SeeMidia:**

###### Funcionalidades Implementadas:
1. **Fullscreen Imersivo Total**:
   - `SystemUiMode.immersive` remove todas as barras
   - Background sempre preto
   - Wakelock mantém tela ligada 24/7

2. **Player Universal de Mídia**:
   - **Imagens (NEWS)**: `CachedNetworkImage` + **overlay unificado corporativo**
   - **Vídeos (ADVERTISEMENTS)**: `VideoPlayer` sem áudio
   - **Solução Fullscreen Universal**: `FittedBox(BoxFit.cover)` + `AspectRatio`

3. **Overlay Corporativo Elegante para NEWS** ⭐:
   - **Layout Horizontal**: Logo SeeMidia (esquerda) + Textos (direita)
   - **Branding Forte**: Logo 200x200px bem visível com shadow
   - **Design Profissional**: Container único com gradient + bordas arredondadas
   - **Anti-Imagem Branca**: Fundo semi-transparente preto sempre legível
   - **Responsive**: Altura se adapta ao conteúdo automaticamente
   - **Campos**: Título (36px) + Descrição (20px) + Fonte•Autor (16px com ícone)

4. **Sistema de Timing Preciso**:
   - NEWS: 5 segundos fixo
   - ADS: Campo `seconds` da API (10s, 30s, etc)
   - Progress bar minimalista (branca, bottom)
   - Auto-cycling infinito

5. **Estados Robustos**:
   - Loading: Tela preta silenciosa
   - Error: Tela preta com tap-to-retry
   - Empty: Tela preta 
   - Playing: Conteúdo + progress bar

6. **Otimizações de Performance**:
   - Mount checks em todos async
   - Timer cleanup automático
   - Video dispose otimizado com delays
   - Memory management rigoroso

### 📊 FLUXO DE DADOS API:

#### **Autenticação QR Code**:
```json
POST /auth/qr-login
{
  "qr_code": "seemidia://unit/64f5b2a8e4b0c3d2f1a6b9c7"
}

Response:
{
  "success": true,
  "data": {
    "access_token": "jwt-token",
    "id": "user-id",
    "units": [...]
  }
}
```

#### **Display Content**:
```json
GET /display/unit/64f5b2a8e4b0c3d2f1a6b9c7
Authorization: Bearer jwt-token

Response:
{
  "success": true,
  "unit": {
    "_id": "64f5b2a8e4b0c3d2f1a6b9c7",
    "name": "Loja Centro SP",
    "status": "ACTIVE"
  },
  "data": [
    {
      "type": "NEWS",
      "news": {
        "_id": "news-id",
        "image": "https://img-url.jpg",      // ⚠️ É 'image' não 'url' 
        "title": "Título da notícia",
        "description": "Descrição...",
        "source_name": "Metropoles.com",
        "author": "Nome Autor",
        "status": "ACTIVE"
      }
    },
    {
      "type": "ADVERTISEMENT", 
      "ads": {
        "_id": "ad-id",
        "source": "https://video-url.mp4",   // ⚠️ É 'source' não 'url'
        "title": "Nome do anúncio",
        "seconds": 30,                       // ⚠️ Duração customizada
        "status": "ACTIVE"
      }
    }
  ]
}
```

### 🎯 PROBLEMAS CRÍTICOS RESOLVIDOS:

1. **Vídeo não fullscreen em qualquer dimensão**:
   - Solução: `FittedBox(fit: BoxFit.cover)` + `AspectRatio`
   - Funciona com 876×496, 1920×1080, qualquer tamanho

2. **Memory leaks e crashes**:
   - Mount checks antes de setState
   - Timer cancellation automático
   - Video dispose com delays (200ms)

3. **Codec AAC warnings**:
   - `setVolume(0.0)` ANTES de inicializar player
   - `mixWithOthers: false`

4. **Campos incorretos da API**:
   - NEWS usa `news.image` não `news.url`
   - ADS usa `ads.source` não `ads.url`  
   - ADS usa `ads.seconds` para timing

5. **Background verde padrão Flutter**:
   - `backgroundColor: Colors.black` forçado
   - Scaffold e Container sempre pretos

6. **Overlay de texto separado e pouco elegante** ⭐:
   - **SOLUÇÃO**: Overlay unificado horizontal com logo + textos
   - **Design corporativo**: Logo SeeMidia bem visível (200x200px)
   - **Legibilidade garantida**: Funciona com imagens brancas/claras
   - **Branding forte**: Espaço dedicado à empresa no overlay
   - **Visual profissional**: Container único com gradient e shadows

### 🚀 MIGRAÇÃO PARA REACT NATIVE:

#### **Dependências Equivalentes**:
```json
{
  "@react-native-async-storage/async-storage": "^1.21.0",  // StorageService
  "@react-native-firebase/app": "^18.6.2",                // Firebase
  "@react-native-firebase/database": "^18.6.2",           // Firebase DB
  "react-native-camera": "^4.2.1",                        // QR Scanner
  "react-native-video": "^5.2.1",                         // Video Player  
  "react-native-fast-image": "^8.6.3",                    // Image Cache
  "react-native-orientation-locker": "^1.5.0",            // Orientation
  "@react-native-keep-awake/keep-awake": "^2.1.1",       // Wakelock
  "react-native-system-navigation-bar": "^2.6.1"         // Fullscreen
}
```

#### **Componentes Core para Criar**:

1. **DisplayPlayer** (equivale a DisplayScreen):
   - Fullscreen com `react-native-system-navigation-bar`
   - Video com `react-native-video` (muted: true)
   - Image com `react-native-fast-image`
   - Timer com `useInterval` hook
   - Progress bar customizada

2. **APIClient** (equivale a ApiService):
   - Fetch wrapper com retry logic
   - Auth header automático 
   - Generic typing com TypeScript

3. **AuthProvider** (equivale a AuthService):
   - Context para auth state
   - QR Code authentication
   - Token refresh automático

#### **Estados e Hooks Necessários**:
```typescript  
// Player state
const [contentIndex, setContentIndex] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const [progress, setProgress] = useState(0);
const [contents, setContents] = useState<DisplayContent[]>([]);

// API integration
const { data: displayUnit } = useDisplayUnit(unitId);
const { mutate: logCompletion } = useLogContentCompletion();
```

#### **Arquivo de Configuração React Native**:
```typescript
// config/seemidia.ts
export const SEEMIDIA_CONFIG = {
  API_BASE_URL: 'https://api.seemidia.com/v1',
  NEWS_DURATION: 5000, // 5 segundos
  FULLSCREEN_MODE: 'immersive',
  WAKELOCK_ENABLED: true,
  AUTO_REFRESH: true,
  QR_REGEX: /seemidia:\/\/unit\/[a-f0-9]{24}/,
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov'],
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp']
};
```

### ⚡ COMANDOS FINAIS FLUTTER:
```bash
# Deploy final no tablet
adb connect 192.168.1.14 && flutter run -d 192.168.1.14:5555

# Build APK de produção  
flutter build apk --release

# Ver logs em tempo real
adb logcat | grep flutter
```

### 🎯 **RESUMO EXECUTIVO**:
Sistema 100% funcional de display digital 24/7 com:
- ✅ Autenticação QR Code + Firebase 
- ✅ Lista de unidades estilo Netflix
- ✅ Player fullscreen universal (qualquer resolução)
- ✅ Suporte NEWS (imagens, 5s) e ADS (vídeos, timing variável)
- ✅ Sistema robusto anti-crash com wakelock
- ✅ API integration completa com retry logic
- ✅ Performance otimizada para tablets Android 10+

**Pronto para migração React Native** com toda documentação técnica detalhada acima! 🚀
