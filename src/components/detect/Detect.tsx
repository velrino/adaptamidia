"use client";
import { useEffect, useRef, useState } from "react";
import { InferenceEngine, CVImage } from "inferencejs";

const ROBOFLOW_CONFIG = {
  publishable_key: "REDACTED", // Substitua pela sua chave (formato: rf_xxxxx)
  model: "person-detection-9a6mk",
  version: 16,
};

export default function PersonDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [inferenceEngine, setInferenceEngine] =
    useState<InferenceEngine | null>(null);
  const [fps, setFps] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const animationRef = useRef<number>();
  const lastPredictions = useRef<any[]>([]);
  const fpsCounter = useRef({ frames: 0, lastTime: Date.now() });
  const isDetectingRef = useRef(false);

  // Inicializa o InferenceEngine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        setError(null);
        console.log("Inicializando InferenceEngine...");

        const engine = new InferenceEngine();

        // Método correto de inicialização
        const workerId = await engine.startWorker(
          ROBOFLOW_CONFIG.model,
          ROBOFLOW_CONFIG.version,
          ROBOFLOW_CONFIG.publishable_key,
          [
            {
              scoreThreshold: 0.5,
              iouThreshold: 0.3,
              maxDetections: 20,
            },
          ]
        );

        console.log("Worker iniciado com ID:", workerId);
        setInferenceEngine(engine);
        setModelLoaded(true);
        console.log("Modelo carregado com sucesso!");
      } catch (error) {
        console.error("Erro detalhado ao inicializar:", error);
        setError(`Erro ao carregar modelo: ${error}`);

        // Tenta método alternativo
        try {
          console.log("Tentando método alternativo...");
          const engine = new InferenceEngine();

          // Inicialização simplificada
          await engine.startWorker(
            `${ROBOFLOW_CONFIG.model}/${ROBOFLOW_CONFIG.version}`,
            ROBOFLOW_CONFIG.publishable_key
          );

          setInferenceEngine(engine);
          setModelLoaded(true);
          setError(null);
          console.log("Modelo carregado com método alternativo!");
        } catch (altError) {
          console.error("Método alternativo também falhou:", altError);
          setError(`Falha na inicialização: ${altError}`);
        }
      }
    };

    initializeEngine();

    return () => {
      if (inferenceEngine) {
        try {
          inferenceEngine.stopWorker();
        } catch (e) {
          console.warn("Erro ao parar worker:", e);
        }
      }
    };
  }, []);

  // Configura a webcam
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          console.log("Webcam configurada com sucesso");
        }
      } catch (error) {
        console.error("Erro ao acessar webcam:", error);
        setError(`Erro na webcam: ${error}`);
      }
    };

    setupCamera();
  }, []);

  // Função para detectar pessoas usando InferenceJS
  const detectPeople = async () => {
    if (
      !inferenceEngine ||
      !videoRef.current ||
      isDetectingRef.current ||
      !modelLoaded
    )
      return;

    isDetectingRef.current = true;
    setIsDetecting(true);

    try {
      const video = videoRef.current;

      // Verifica se o vídeo está pronto
      if (video.readyState < 2) {
        isDetectingRef.current = false;
        setIsDetecting(false);
        return;
      }

      // Método 1: Usando CVImage
      try {
        const image = new CVImage(video);
        const predictions = await inferenceEngine.infer(image);
        lastPredictions.current = predictions || [];
      } catch (cvError) {
        // Método 2: Usando canvas como fallback
        console.log("Tentando método canvas fallback...");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const predictions = await inferenceEngine.infer(imageData);
          lastPredictions.current = predictions || [];
        }
      }
    } catch (error) {
      console.error("Erro na detecção:", error);
    } finally {
      isDetectingRef.current = false;
      setIsDetecting(false);
    }
  };

  // Função para renderizar o vídeo continuamente
  const renderVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width === 0 || height === 0) {
      animationRef.current = requestAnimationFrame(renderVideo);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // Desenha o frame atual do vídeo
    context.drawImage(video, 0, 0, width, height);

    // Desenha as detecções
    if (lastPredictions.current.length > 0) {
      drawDetections(context, lastPredictions.current);
    }

    // Calcula FPS
    updateFPS();

    // Continua o loop de renderização
    animationRef.current = requestAnimationFrame(renderVideo);
  };

  // Calcula FPS para monitoramento
  const updateFPS = () => {
    fpsCounter.current.frames++;
    const now = Date.now();
    const elapsed = now - fpsCounter.current.lastTime;

    if (elapsed >= 1000) {
      setFps(Math.round((fpsCounter.current.frames * 1000) / elapsed));
      fpsCounter.current.frames = 0;
      fpsCounter.current.lastTime = now;
    }
  };

  // Inicia os loops quando tudo estiver pronto
  useEffect(() => {
    if (!modelLoaded) return;

    // Inicia o loop de renderização contínuo
    renderVideo();

    // Faz detecção quando o modelo estiver carregado
    if (isRunning) {
      const detectionInterval = setInterval(detectPeople, 1000);
      return () => clearInterval(detectionInterval);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [modelLoaded, isRunning]);

  // Função para desenhar as detecções
  const drawDetections = (
    ctx: CanvasRenderingContext2D,
    predictions: any[]
  ) => {
    predictions.forEach((prediction) => {
      // Tenta diferentes formatos de bbox
      let x, y, width, height;

      if (prediction.bbox) {
        [x, y, width, height] = prediction.bbox;
      } else if (prediction.x !== undefined) {
        x = prediction.x - prediction.width / 2;
        y = prediction.y - prediction.height / 2;
        width = prediction.width;
        height = prediction.height;
      } else {
        return; // Pula se não conseguir extrair coordenadas
      }

      const label = prediction.class || prediction.className || "person";
      const confidence = prediction.confidence || prediction.score || 0;

      // Desenha a caixa
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Desenha o texto
      const text = `${label} ${Math.round(confidence * 100)}%`;
      ctx.font = "16px Arial";
      ctx.fillStyle = "#00FF00";
      ctx.fillText(text, x, y - 5);
    });
  };

  // Função para alternar detecção
  const toggleDetection = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />

      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxWidth: "640px",
          border: "2px solid #333",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        }}
      />

      {/* Controles */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button
          onClick={toggleDetection}
          disabled={!modelLoaded}
          style={{
            padding: "10px 20px",
            backgroundColor: isRunning ? "#FF6B35" : "#00FF00",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: modelLoaded ? "pointer" : "not-allowed",
          }}
        >
          {isRunning ? "Parar Detecção" : "Iniciar Detecção"}
        </button>
      </div>

      {/* Status bar */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "10px",
          padding: "10px",
          background: "rgba(0, 0, 0, 0.1)",
          borderRadius: "4px",
          fontSize: "14px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong>Modelo:</strong>{" "}
          {!modelLoaded ? "Carregando..." : "✅ Pronto"}
        </div>
        <div>
          <strong>Detecção:</strong> {isRunning ? "🔴 Ativa" : "⏸️ Pausada"}
        </div>
        <div>
          <strong>FPS:</strong> {fps}
        </div>
        <div>
          <strong>Pessoas:</strong> {lastPredictions.current.length}
        </div>
        {isDetecting && (
          <div style={{ color: "#FF6B35" }}>🔍 Processando...</div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: "4px",
            color: "#d32f2f",
            fontSize: "12px",
            maxWidth: "600px",
          }}
        >
          <strong>Erro:</strong> {error}
        </div>
      )}

      {/* Instruções */}
      <div
        style={{
          marginTop: "10px",
          padding: "15px",
          background: "rgba(0, 0, 0, 0.05)",
          borderRadius: "8px",
          fontSize: "12px",
          maxWidth: "600px",
          textAlign: "center",
        }}
      >
        <strong>Instruções:</strong>
        <br />
        1. Instale: <code>npm install inferencejs</code>
        <br />
        2. Substitua "rf_your_api_key_here" pela sua chave do Roboflow
        <br />
        3. Sua chave deve ter o formato: <code>rf_xxxxxxxxxx</code>
        <br />
        4. Certifique-se de que o modelo está publicado e acessível
      </div>
    </div>
  );
}
