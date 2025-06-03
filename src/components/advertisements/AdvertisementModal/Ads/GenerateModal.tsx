import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { IUseModal } from "@/hooks/useModal";
import { AdType } from "@/interfaces/ads";
import React, { useState, useRef, useEffect } from "react";
import { LuImagePlus } from "react-icons/lu";

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

interface MediaCropperModalProps {
  open: boolean;
  currentModal: IUseModal;
  onCropComplete: (croppedMedia: Blob, type: AdType) => void;
}

export const GenerateAdvertisementModal: React.FC<MediaCropperModalProps> = ({
  open,
  currentModal,
}) => {
  useEffect(() => {
    currentModal.openModal();
  }, [currentModal]);

  const [prompt, setPromp] = useState<string>(String());
  const demoText = `A confident woman, speaks in a bright studio. She looks into the camera and says:\n\n"Criar um anúncio incrível em segundos?"\n\nThen, same angle and framing, the background seamlessly shifts to a Dubai rooftop at night. Now she finishes:\n\n"Crie com Alpha Mídia!"`;
  const [demoTextIndex, setDemoTextIndex] = useState<number>(0);

  useEffect(() => {
    if (demoTextIndex < demoText.length) {
      const timeout = setTimeout(() => {
        setPromp((prev) => prev + demoText[demoTextIndex]);
        setDemoTextIndex((prev) => prev + 1);
      }, 20);

      return () => clearTimeout(timeout);
    }
  }, [demoTextIndex, demoText]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [prompt]);

  return (
    <>
      <Button
        onClick={() => currentModal.openModal()}
        className="p-10 bg-principal hover:bg-principal"
      >
        <LuImagePlus size={40} className="text-white" />
      </Button>

      <Modal
        isOpen={open}
        onClose={currentModal.closeModal}
        showCloseButton={false}
        className="max-w-[30vw] p-6"
      >
        <div>
          <div className="mb-6 text-xl">Escreva seu prompt</div>
          <TextArea
            ref={textareaRef}
            rows={10}
            value={prompt}
            onChange={(value) => setPromp(value)}
            className="resize-none"
            // error
            // hint="Please enter a valid message."
          />
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={currentModal.closeModal}>
            Cancelar
          </Button>
          <Button onClick={() => {}}>Gerar</Button>
        </div>
      </Modal>
    </>
  );
};
