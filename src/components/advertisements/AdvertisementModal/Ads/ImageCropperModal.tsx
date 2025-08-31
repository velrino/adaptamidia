import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { IUseModal } from "@/hooks/useModal";
import { AdType } from "@/interfaces/ads";
import React, { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import { LuImageUp } from "react-icons/lu";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

// Função para recortar imagens
export async function getCroppedImg(
  imageSrc: string,
  cropArea: { width: number; height: number; x: number; y: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return reject("Canvas Context is null");

      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject("Blob creation failed");
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = (err) => reject(err);
  });
}

// Função para recortar vídeos (exemplo básico)
// async function getCroppedVideo(
//   videoSrc: string,
//   cropArea: { width: number; height: number; x: number; y: number }
// ): Promise<Blob> {
//   return new Promise((resolve, reject) => {
//     const video = document.createElement("video");
//     video.src = videoSrc;
//     video.onloadeddata = () => {
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");

//       if (!ctx) return reject("Canvas Context is null");

//       canvas.width = cropArea.width;
//       canvas.height = cropArea.height;

//       // Desenha o frame atual do vídeo no canvas
//       ctx.drawImage(
//         video,
//         cropArea.x,
//         cropArea.y,
//         cropArea.width,
//         cropArea.height,
//         0,
//         0,
//         cropArea.width,
//         cropArea.height
//       );

//       canvas.toBlob((blob) => {
//         if (!blob) return reject("Blob creation failed");
//         resolve(blob);
//       }, "video/mp4");
//     };
//     video.onerror = (err) => reject(err);
//   });
// }

export enum CropOrientation {
  Landscape = "landscape",
  Portrait = "portrait",
}

interface MediaCropperModalProps {
  open: boolean;
  currentModal: IUseModal;
  onCropComplete: (croppedMedia: Blob, type: AdType) => void;
  file?: {
    source: string;
    type: "image" | "video";
  };
  orientation: CropOrientation; // Define se 16:9 (landscape) ou 9:16 (portrait)
  buttonLabel?: string;
}

export const MediaCropperModal: React.FC<MediaCropperModalProps> = ({
  open,
  currentModal,
  onCropComplete,
  file,
  orientation,
  buttonLabel,
}) => {
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      currentModal.openModal();
      const file = event.target.files[0];
      const fileDataUrl = URL.createObjectURL(file);
      setFileSrc(fileDataUrl);
      setFileType(file.type.startsWith("image") ? "image" : "video");
    }
  };

  const onCropCompleteHandler = useCallback(
    (
      _: unknown,
      areaPixels: { width: number; height: number; x: number; y: number }
    ) => {
      setCroppedAreaPixels(areaPixels);
    },
    []
  );

  const compressVideoInBrowser = async (
    src: string,
    isPortrait: boolean
  ): Promise<Blob> => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    setProgress(0);
    ffmpeg.on("progress", ({ progress }: { progress: number }) => {
      if (typeof progress === "number")
        setProgress(Math.min(1, Math.max(0, progress)));
    });

    await ffmpeg.writeFile("in.mp4", await fetchFile(src));

    const scaleFilter = isPortrait ? "scale=-2:1920" : "scale=1920:-2";

    try {
      await ffmpeg.exec([
        "-y",
        "-i",
        "in.mp4",
        "-vf",
        scaleFilter,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "out.mp4",
      ]);
    } catch (error) {
      try {
        await ffmpeg.exec([
          "-y",
          "-i",
          "in.mp4",
          "-vf",
          scaleFilter,
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "28",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "copy",
          "out.mp4",
        ]);
      } catch (e2) {
        const response = await fetch(src);
        return await response.blob();
      }
    }

    const data: any = await ffmpeg.readFile("out.mp4");
    return new Blob([data], { type: "video/mp4" });
  };

  const handleCrop = async () => {
    if (fileSrc && croppedAreaPixels) {
      let croppedMediaBlob: Blob;

      if (fileType === "image") {
        croppedMediaBlob = await getCroppedImg(fileSrc, croppedAreaPixels);
      } else if (fileType === "video") {
        try {
          setIsProcessing(true);
          const isPortrait = orientation !== CropOrientation.Landscape;
          croppedMediaBlob = await compressVideoInBrowser(fileSrc, isPortrait);
        } catch {
          const response = await fetch(fileSrc);
          croppedMediaBlob = await response.blob();
        } finally {
          setIsProcessing(false);
          setProgress(0);
        }
      } else {
        return;
      }

      onCropComplete(
        croppedMediaBlob,
        fileType === "video" ? AdType.VIDEO : AdType.IMAGE
      );
      currentModal.closeModal();
      setFileSrc(null);
    }
  };

  useEffect(() => {
    if (file?.source && file?.type) {
      setFileSrc(() => file.source);
      setFileType(() => file.type);
      currentModal.openModal();
    }
  }, [file, currentModal]);

  return (
    <>
      <input
        type="file"
        accept="image/*,video/mp4"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="w-full md:w-100 border-2 border-dashed border-gray-300 dark:border-gray-600 p-3 md:p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-sm md:text-base"
      >
        <LuImageUp size={16} className="md:w-5 md:h-5 mr-2" />
        {buttonLabel || "Fazer Upload"}
      </Button>

      {fileSrc && (
        <Modal
          isOpen={open}
          onClose={currentModal.closeModal}
          showCloseButton={false}
          className="max-w-[80vw] p-6"
        >
          {/* <div className="text-black">
            {fileType === "image" ? "Recorte de Imagem" : "Recorte de Vídeo"}
          </div> */}

          <div
            className="relative w-full max-h-[60vh] bg-gray-900"
            style={{
              aspectRatio:
                orientation === CropOrientation.Landscape ? "16 / 9" : "9 / 16",
            }}
          >
            <Cropper
              {...(fileType === "image"
                ? { image: fileSrc }
                : { video: fileSrc })}
              crop={crop}
              zoom={zoom}
              aspect={
                orientation === CropOrientation.Landscape ? 16 / 9 : 9 / 16
              }
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteHandler}
            />
          </div>
          <div className="flex justify-between mt-4 items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isProcessing && fileType === "video"
                ? `Comprimindo vídeo… ${Math.round(progress * 100)}%`
                : ""}
            </div>
            <Button
              variant="outline"
              onClick={currentModal.closeModal}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleCrop} disabled={isProcessing}>
              {fileType === "image" ? "Recortar" : "Confirmar"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};
