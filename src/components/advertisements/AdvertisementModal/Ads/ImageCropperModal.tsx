import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
// import { ImageUp } from "lucide-react";

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

interface ImageCropperModalProps {
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  open,
  onClose,
  onCropComplete,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
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
      const imageDataUrl = URL.createObjectURL(file);
      setImageSrc(imageDataUrl);
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
    if (imageSrc && croppedAreaPixels) {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
      onClose();
      setImageSrc(null);
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="p-10 bg-principal hover:bg-principal"
      >
        TEST
        {/* <ImageUp size={40} className="text-gray-900" /> */}
      </Button>

      {imageSrc && (
        <Modal
          isOpen={open}
          onClose={onClose}
          showCloseButton={false}
          className="min-w-[95vw] max-w-[95vw] min-h-[95vh] p-6 lg:p-10 flex flex-col"
        >
          Recorte
          <div className="relative w-full h-[60vh] bg-gray-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9} // Proporção 16:9 para TV
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteHandler}
            />
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleCrop}>Recortar</Button>
          </div>
        </Modal>
      )}
    </>
  );
};
