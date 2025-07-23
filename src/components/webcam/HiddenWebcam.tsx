import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

export interface HiddenWebcamHandle {
  captureFrame: () => Promise<Blob | null>;
}

const HiddenWebcam = forwardRef<HiddenWebcamHandle>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Aguarda o evento canplay antes de chamar play()
          await new Promise((resolve, reject) => {
            const video = videoRef.current!;
            const onCanPlay = () => {
              video.removeEventListener("canplay", onCanPlay);
              resolve(null);
            };
            video.addEventListener("canplay", onCanPlay);
            // Timeout de segurança
            setTimeout(() => {
              video.removeEventListener("canplay", onCanPlay);
              resolve(null);
            }, 2000);
          });
          if (!cancelled && videoRef.current.paused) {
            await videoRef.current.play().catch((err) => {
              if (err.name !== "AbortError") throw err;
            });
          }
        }
      } catch (err) {
        console.error("Erro ao acessar webcam:", err);
      }
    })();
    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async captureFrame() {
      const video = videoRef.current;
      if (!video) return null;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
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

export default HiddenWebcam;
