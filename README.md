# SeeMidia — Digital Signage Player (Flutter)

Aplicativo de player 24/7 para exibir notícias e anúncios em tablets Android. Offline‑first, estável e simples de operar — feito para “melhorar sua vida” no dia a dia de operação.

## Destaques

- Offline‑first: baixa todos os vídeos e imagens no primeiro uso e só toca conteúdo 100% em cache.
- Sincronização automática: a cada 10 minutos busca atualizações, baixa mídias novas e atualiza a playlist sem interromper a reprodução.
- Gestão de armazenamento: remove mídias não usadas há 15 dias antes de baixar novas, evitando encher o dispositivo.
- Fullscreen imersivo: UI sempre em tela cheia e `wakelock` ativado (funcionamento 24/7).
- Vídeos otimizados: reprodução a partir de arquivo local; servidor HTTP interno quando necessário.
- Imagens com cache persistente: `flutter_cache_manager` por baixo do `CachedNetworkImage`.

## Requisitos

- Flutter SDK 3.9.x
- Android 10+ (tablets comerciais)
- Acesso à internet para o primeiro download (funciona offline depois)

## Como rodar

1) Dependências

```
flutter pub get
```

2) Executar no dispositivo/emulador

```
flutter run -d <device-id>
```

3) Build APK (debug)

```
flutter build apk --debug
```

Observação: na primeira execução, o app baixa todos os conteúdos da unidade e mostra uma tela de “Preparando conteúdo para modo offline…”. Depois disso, inicia a exibição contínua.

## Configuração

- Autenticação: o token é lido via `StorageService.getAuthToken()`.
- Endpoint da playlist: atualmente definido no código de `DisplayScreen` (rota `/display/unit/{unitId}`). Recomenda‑se externalizar via `--dart-define` em uma próxima iteração.

## Estrutura principal

- `lib/screens/authenticated/display_screen.dart`: player fullscreen, preload inicial, filtro offline, sync a cada 10 minutos e barra de progresso.
- `lib/services/video_cache_service.dart`: cache de vídeos (download, verificação, limpeza por idade/desuso).
- `lib/services/image_cache_service.dart`: cache de imagens (download, verificação, limpeza por idade/desuso via `flutter_cache_manager`).
- `lib/components/flutter_video_player.dart`: player de vídeo usando `video_player` priorizando arquivo local.
- `CLAUDE.md`: contexto vivo do projeto e decisões técnicas atuais.

## Operação 24/7

- Wakelock ativado e modo imersivo aplicado ao entrar no player.
- Primeiro uso: limpeza de cache antigo (>15 dias) → download de toda a playlist → exibição apenas do que está em disco.
- Em execução: sincroniza a cada 10 minutos, pré‑baixa mídias novas e só então troca a playlist ativa.

## Solução de problemas

- Sem conteúdo: confirme token válido e resposta da rota `/display/unit/{unitId}`.
- Demora no primeiro start: é o download inicial. Em redes lentas pode levar alguns minutos.
- Armazenamento cheio: a limpeza automática remove o que não foi usado há 15 dias. Se necessário, reduza o prazo no serviço ou limite o tamanho total do cache.

## Roadmap curto

- Tornar a base URL configurável por ambiente (`--dart-define`).
- Avançar anúncios pelo término real do vídeo (em vez de timer fixo).
- Serviço nativo para sincronização mesmo em background real (WorkManager/ForegroundService).

---

Para detalhes aprofundados (arquitetura, decisões e fluxos), consulte `CLAUDE.md`.
