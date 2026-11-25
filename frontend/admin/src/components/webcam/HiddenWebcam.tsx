import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

export interface HiddenWebcamHandle {
  captureFrame: () => Promise<Blob | null>;
}

type CameraStatus = "starting" | "ready" | "unavailable";

const HiddenWebcam = forwardRef<HiddenWebcamHandle, {
  onStatusChange?: (status: CameraStatus) => void;
}>(({ onStatusChange }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    const video = videoRef.current;
    onStatusChange?.("starting");
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled || !video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (!cancelled) onStatusChange?.("ready");
      } catch (err) {
        if (!cancelled) {
          stream?.getTracks().forEach((track) => track.stop());
          onStatusChange?.("unavailable");
          console.error("Erro ao acessar webcam:", err);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (video && video.srcObject === stream) video.srcObject = null;
    };
  }, [onStatusChange]);

  useImperativeHandle(ref, () => ({
    async captureFrame() {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.85);
      });
    },
  }));

  // Não renderiza nada visível
  return (
    <video
      ref={videoRef}
      style={{ display: "none" }}
      playsInline
      muted
      autoPlay
      tabIndex={-1}
      aria-hidden="true"
    />
  );
});

HiddenWebcam.displayName = "HiddenWebcam";

export default HiddenWebcam;
