"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  ObjectDetector,
  FilesetResolver,
  Detection,
} from "@mediapipe/tasks-vision";

// Configurações responsivas
const getVideoConfig = () => {
  if (typeof window === "undefined") {
    return { width: 640, height: 480 };
  }

  const isMobile = window.innerWidth < 768;
  const maxWidth = Math.min(window.innerWidth - 32, isMobile ? 480 : 640);
  const aspectRatio = 4 / 3;

  return {
    width: maxWidth,
    height: Math.round(maxWidth / aspectRatio),
  };
};

const STYLE_CONFIG = {
  BOX_COLOR: "#10b981", // green-500
  BOX_WIDTH: 2,
  FONT_SIZE_MOBILE: 12,
  FONT_SIZE_DESKTOP: 14,
  TEXT_COLOR: "#10b981",
  TEXT_BACKGROUND: "rgba(0, 0, 0, 0.8)",
} as const;

interface DetectionState {
  isLoading: boolean;
  error: string | null;
  personCount: number;
  videoConfig: { width: number; height: number };
  isMobile: boolean;
}

// MediaPipe Detector Singleton
class MediaPipeDetectorManager {
  private static instance: MediaPipeDetectorManager;
  private detector: ObjectDetector | null = null;
  private isInitialized = false;

  static getInstance(): MediaPipeDetectorManager {
    if (!MediaPipeDetectorManager.instance) {
      MediaPipeDetectorManager.instance = new MediaPipeDetectorManager();
    }
    return MediaPipeDetectorManager.instance;
  }

  async getDetector(): Promise<ObjectDetector> {
    if (!this.detector && !this.isInitialized) {
      this.isInitialized = true;
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        this.detector = await ObjectDetector.createFromOptions(vision, {
          scoreThreshold: 0.5,
          categoryAllowlist: ["person"],
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
          },
        });
      } catch (error) {
        this.isInitialized = false;
        throw error;
      }
    }
    if (!this.detector) {
      throw new Error("Detector not initialized");
    }
    return this.detector;
  }
}

function drawBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  videoWidth: number,
  videoHeight: number,
  isMobile: boolean
) {
  ctx.clearRect(0, 0, videoWidth, videoHeight);
  const fontSize = isMobile
    ? STYLE_CONFIG.FONT_SIZE_MOBILE
    : STYLE_CONFIG.FONT_SIZE_DESKTOP;

  detections.forEach((detection, index) => {
    const box = detection.boundingBox;
    if (!box) return;
    // Bounding box coordinates
    const x = box.originX;
    const y = box.originY;
    const width = box.width;
    const height = box.height;
    // Desenhar bounding box
    ctx.strokeStyle = STYLE_CONFIG.BOX_COLOR;
    ctx.lineWidth = STYLE_CONFIG.BOX_WIDTH;
    ctx.strokeRect(x, y, width, height);
    // Preparar texto
    const label = `Pessoa ${index + 1}`;
    const confidence = Math.round(
      (detection.categories?.[0]?.score || 0) * 100
    );
    const text = isMobile
      ? `P${index + 1} ${confidence}%`
      : `${label} (${confidence}%)`;
    // Configurar fonte
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize + 4;
    // Calcular posição do texto
    const textX = x;
    const textY = y > textHeight + 10 ? y - 8 : y + textHeight + 15;
    // Desenhar fundo do texto
    ctx.fillStyle = STYLE_CONFIG.TEXT_BACKGROUND;
    ctx.fillRect(
      textX - 4,
      textY - textHeight + 2,
      textWidth + 8,
      textHeight + 2
    );
    // Desenhar texto
    ctx.fillStyle = STYLE_CONFIG.TEXT_COLOR;
    ctx.fillText(text, textX, textY - 2);
  });
}

interface IWebCamComponent {
  showWebcam: boolean;
}

export function WebCamComponent({ showWebcam }: IWebCamComponent) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const [state, setState] = useState<DetectionState>({
    isLoading: true,
    error: null,
    personCount: 0,
    videoConfig: { width: 640, height: 480 },
    isMobile: false,
  });

  // Detectar mobile e configurar dimensões
  useEffect(() => {
    const updateConfig = () => {
      const isMobile = window.innerWidth < 768;
      const videoConfig = getVideoConfig();
      setState((prev) => ({
        ...prev,
        isMobile,
        videoConfig,
      }));
    };
    updateConfig();
    window.addEventListener("resize", updateConfig);
    return () => window.removeEventListener("resize", updateConfig);
  }, []);

  const setupCamera = useCallback(async (): Promise<void> => {
    const video = videoRef.current;
    if (!video) throw new Error("Elemento de vídeo não encontrado");
    try {
      let constraints;
      if (state.isMobile) {
        constraints = {
          video: {
            facingMode: "user",
          },
        };
      } else {
        constraints = {
          video: {
            width: { ideal: state.videoConfig.width },
            height: { ideal: state.videoConfig.height },
            aspectRatio: 4 / 3,
            facingMode: "environment",
            frameRate: { ideal: 30 },
          },
        };
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          resolve(null);
        };
        video.onerror = (e) => {
          reject(e);
        };
      });
      await new Promise((resolve) => {
        if (video.readyState >= 3) return resolve(null);
        video.oncanplay = () => resolve(null);
      });
      await video.play();
    } catch (error) {
      let msg = "Erro ao acessar câmera";
      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError")
      ) {
        msg =
          "Permissão da câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.";
      } else if (
        error instanceof DOMException &&
        error.name === "NotFoundError"
      ) {
        msg = "Nenhuma câmera encontrada neste dispositivo.";
      } else if (error instanceof Error) {
        msg = error.message;
      }
      throw new Error(msg);
    }
  }, [state.videoConfig, state.isMobile]);

  const renderPrediction = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) {
      animationIdRef.current = requestAnimationFrame(renderPrediction);
      return;
    }
    try {
      const detector =
        await MediaPipeDetectorManager.getInstance().getDetector();
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Contexto do canvas não disponível");
      const result = await detector.detect(video);
      // Filtrar apenas pessoas (já filtrado pelo allowlist, mas por segurança)
      const personDetections = (result.detections || []).filter((d) =>
        d.categories?.some((cat) => cat.categoryName === "person")
      );
      setState((prev) => ({ ...prev, personCount: personDetections.length }));
      drawBoundingBoxes(
        ctx,
        personDetections,
        state.videoConfig.width,
        state.videoConfig.height,
        state.isMobile
      );
    } catch (error) {
      console.error("Erro na detecção:", error);
      setState((prev) => ({
        ...prev,
        error: `Erro na detecção: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      }));
    }
    const delay = state.isMobile ? 50 : 0;
    setTimeout(() => {
      animationIdRef.current = requestAnimationFrame(renderPrediction);
    }, delay);
  }, [state.videoConfig, state.isMobile]);

  const initialize = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await setupCamera();
      await MediaPipeDetectorManager.getInstance().getDetector();
      setState((prev) => ({ ...prev, isLoading: false }));
      renderPrediction();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }));
    }
  }, [setupCamera, renderPrediction]);

  useEffect(() => {
    if (state.videoConfig.width > 0) {
      isMountedRef.current = true;
      initialize();
    }
    return () => {
      isMountedRef.current = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        video.srcObject = null;
      }
    };
  }, [initialize, state.videoConfig]);

  if (state.error && showWebcam) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div
          className="flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center p-6"
          style={{
            minHeight: state.isMobile ? "280px" : "360px",
          }}
        >
          <div className="space-y-4">
            <div className="text-4xl">❌</div>
            <p className="text-red-600 text-sm md:text-base font-medium px-2">
              {state.error}
            </p>
            <button
              onClick={initialize}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showWebcam && (
        <div className="w-full max-w-2xl mx-auto p-4">
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden shadow-lg bg-black"
            style={{
              width: "100%",
              maxWidth: `${state.videoConfig.width}px`,
              aspectRatio: "4/3",
            }}
          >
            {/* Contador de pessoas */}
            <div className="absolute top-3 left-3 z-30 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm md:text-base font-semibold">
              <span className="mr-1">👥</span>
              <span className="hidden sm:inline">
                {state.personCount}{" "}
                {state.personCount === 1 ? "pessoa" : "pessoas"}
              </span>
              <span className="sm:hidden">{state.personCount}</span>
            </div>
            {/* Loading indicator */}
            {state.isLoading && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 text-white">
                <div className="text-center space-y-3">
                  <div className="animate-spin text-3xl">🔄</div>
                  <p className="text-sm md:text-base">
                    <span className="hidden sm:inline">
                      Carregando detector...
                    </span>
                    <span className="sm:hidden">Carregando...</span>
                  </p>
                </div>
              </div>
            )}
            {/* Performance indicator para mobile */}
            {state.isMobile && !state.isLoading && (
              <div className="absolute top-3 right-3 z-30 bg-blue-500/20 backdrop-blur-sm text-blue-200 px-2 py-1 rounded text-xs">
                📱 Mobile Mode
              </div>
            )}
            <video
              ref={videoRef}
              width={state.videoConfig.width}
              height={state.videoConfig.height}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas
              ref={canvasRef}
              width={state.videoConfig.width}
              height={state.videoConfig.height}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          </div>
          {/* Informações adicionais */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="hidden sm:block">
              Dimensões: {state.videoConfig.width}x{state.videoConfig.height} •
              {state.isMobile ? " CPU" : " WebGL"} •
              {state.isMobile ? " Baixo FPS" : " Alto FPS"}
            </p>
            <p className="sm:hidden">
              {state.videoConfig.width}x{state.videoConfig.height}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
