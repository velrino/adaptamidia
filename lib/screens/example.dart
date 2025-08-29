import 'package:flutter/material.dart';
import 'package:flutter_vlc_player/flutter_vlc_player.dart';

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key}) : super(key: key);

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late VlcPlayerController _videoPlayerController;

  Future<void> initializePlayer() async {}

  @override
  void initState() {
    super.initState();

    _videoPlayerController = VlcPlayerController.network(
      // 'https://media.w3.org/2010/05/sintel/trailer.mp4',
      'file:///data/user/0/com.seemidia.display/app_flutter/seemidia_videos/c078185e505b9dd3cd964608e60d4ed1.mp4',
      // 'https://storage.googleapis.com/adapta-midia/ads/68964fa0eac4dfe7e80c0fe4/a537f57f-aaf7-4916-beee-1113bdd49b3e',
      hwAcc: HwAcc.full,
      autoPlay: true,
      options: VlcPlayerOptions(),
    );
  }

  @override
  void dispose() {
    _videoPlayerController.stopRendererScanning();
    _videoPlayerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('VLC Player Demo'),
        actions: [
          IconButton(
            icon: Icon(Icons.play_arrow),
            onPressed: () => _videoPlayerController.play(),
            tooltip: 'Play',
          ),
          IconButton(
            icon: Icon(Icons.pause),
            onPressed: () => _videoPlayerController.pause(),
            tooltip: 'Pause',
          ),
          IconButton(
            icon: Icon(Icons.stop),
            onPressed: () => _videoPlayerController.stop(),
            tooltip: 'Stop',
          ),
        ],
      ),
      body: Center(
        child: VlcPlayer(
          controller: _videoPlayerController,
          aspectRatio: 16 / 9,
          placeholder: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Carregando vídeo...'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
