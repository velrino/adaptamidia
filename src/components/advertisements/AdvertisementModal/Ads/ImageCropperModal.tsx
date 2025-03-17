import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { AdType } from "@/interfaces/ads";
import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { LuImageUp } from "react-icons/lu";

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

interface MediaCropperModalProps {
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedMedia: Blob, type: AdType) => void;
}

export const MediaCropperModal: React.FC<MediaCropperModalProps> = ({
  open,
  onClose,
  onCropComplete,
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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
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

  const handleCrop = async () => {
    if (fileSrc && croppedAreaPixels) {
      let croppedMediaBlob: Blob;

      if (fileType === "image") {
        croppedMediaBlob = await getCroppedImg(fileSrc, croppedAreaPixels);
      } else if (fileType === "video") {
        const response = await fetch(fileSrc);
        croppedMediaBlob = await response.blob();
      } else {
        return;
      }

      onCropComplete(
        croppedMediaBlob,
        fileType === "video" ? AdType.VIDEO : AdType.IMAGE
      );
      onClose();
      setFileSrc(null);
    }
  };

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
        className="p-10 bg-principal hover:bg-principal"
      >
        <LuImageUp size={40} className="text-gray-900" />
      </Button>

      {fileSrc && (
        <Modal
          isOpen={open}
          onClose={onClose}
          showCloseButton={false}
          className="min-w-[95vw] max-w-[95vw] min-h-[95vh] p-6 lg:p-10 flex flex-col"
        >
          {/* <div className="text-black">
            {fileType === "image" ? "Recorte de Imagem" : "Recorte de Vídeo"}
          </div> */}

          <div className="relative w-full h-[60vh] bg-gray-900">
            <Cropper
              {...(fileType === "image"
                ? { image: fileSrc }
                : { video: fileSrc })}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteHandler}
            />
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleCrop}>
              {fileType === "image" ? "Recortar" : "Confirmar"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};
