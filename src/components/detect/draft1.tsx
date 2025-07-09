"use client";
import { useEffect, useRef, useState } from "react";

const MODEL_ENDPOINT = "https://detect.roboflow.com/person-detection-9a6mk/16";
const API_KEY = "REDACTED";

export default function PersonDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const animationRef = useRef<number>();
  const lastPredictions = useRef<any[]>([]);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            frameRate: 30,
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsRunning(true);
        }
      } catch (error) {
        console.error("Erro ao acessar webcam:", error);
      }
    };
    setupCamera();
  }, []);

  // Função para renderizar o vídeo continuamente
  const renderVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    canvas.width = width;
    canvas.height = height;

    // Desenha o frame atual do vídeo
    context.drawImage(videoRef.current, 0, 0, width, height);

    // Desenha as últimas detecções
    if (lastPredictions.current.length > 0) {
      drawDetections(context, lastPredictions.current);
    }

    // Continua o loop de renderização
    animationRef.current = requestAnimationFrame(renderVideo);
  };

  // Função para detectar pessoas (menos frequente)
  const detectPeople = async () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;

    setIsDetecting(true);

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;

      // Cria um canvas temporário para capturar o frame
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempContext = tempCanvas.getContext("2d");

      if (!tempContext) return;

      tempContext.drawImage(videoRef.current, 0, 0, width, height);

      // Converte para blob com qualidade reduzida para economizar banda
      const imageBlob = await new Promise<Blob>((resolve) =>
        tempCanvas.toBlob((blob) => blob && resolve(blob), "image/jpeg", 0.7)
      );

      const formData = new FormData();
      formData.append("file", imageBlob as Blob);

      const res = await fetch(`${MODEL_ENDPOINT}?api_key=${API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      // Atualiza as predições
      lastPredictions.current = result.predictions || [];
    } catch (error) {
      console.error("Erro na detecção:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    // Inicia o loop de renderização contínuo
    renderVideo();

    // Faz detecção a cada 2 segundos (muito menos frequente)
    const detectionInterval = setInterval(detectPeople, 2000);

    return () => {
      clearInterval(detectionInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  const drawDetections = (
    ctx: CanvasRenderingContext2D,
    predictions: any[]
  ) => {
    predictions.forEach((pred) => {
      const { x, y, width, height, class: label, confidence } = pred;

      // Desenha a caixa
      ctx.beginPath();
      ctx.rect(x - width / 2, y - height / 2, width, height);
      ctx.strokeStyle = "#FF00FF";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Desenha o fundo do texto
      const text = `${label} ${Math.round(confidence * 100)}%`;
      ctx.font = "16px Arial";
      const textMetrics = ctx.measureText(text);
      const textX = x - width / 2;
      const textY = y - height / 2 - 5;

      ctx.fillStyle = "rgba(255, 0, 255, 0.8)";
      ctx.fillRect(textX, textY - 20, textMetrics.width + 10, 25);

      // Desenha o texto
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(text, textX + 5, textY - 2);
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxWidth: "640px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />
      {isDetecting && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          Detectando...
        </div>
      )}
    </div>
  );
}
