"use client";

import { IApiNewsResponseItem } from "@/backend/api/api.interface";
import { useToast } from "@/context/ToastContext";
import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { LuImageUp, LuUser, LuTag, LuFileText } from "react-icons/lu";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { IToastType } from "@/interfaces/general";
import {
  FormInput,
  FormTextArea,
  FormUrlInput,
  FormDateTimeInput,
  FormSelect,
} from "@/components/ui/input";

interface NewRecordProps {
  recordInformed: IApiNewsResponseItem;
}

async function getCroppedImg(
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

export default function NewRecord({ recordInformed }: NewRecordProps) {
  const [record, setRecord] = useState<IApiNewsResponseItem>(recordInformed);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { showToast } = useToast();
  const cropModal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      cropModal.openModal();
    }
  };

  const onCropComplete = useCallback(
    (
      _: unknown,
      areaPixels: { width: number; height: number; x: number; y: number }
    ) => {
      setCroppedAreaPixels(areaPixels);
    },
    []
  );

  const handleCropConfirm = async () => {
    if (uploadedImage && croppedAreaPixels) {
      try {
        const croppedBlob = await getCroppedImg(
          uploadedImage,
          croppedAreaPixels
        );
        const croppedUrl = URL.createObjectURL(croppedBlob);
        setCroppedImage(croppedUrl);
        setRecord((prev) => ({ ...prev, image: croppedUrl }));
        cropModal.closeModal();
        showToast("Imagem recortada com sucesso!", IToastType.SUCCESS);
      } catch (error) {
        console.log({ error });
        showToast("Erro ao recortar imagem", IToastType.ERROR);
      }
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Aqui você implementaria a lógica de atualização do record
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulação
      showToast("Record atualizado com sucesso!", IToastType.SUCCESS);
    } catch (error) {
      console.log({ error });
      showToast("Erro ao atualizar record", IToastType.ERROR);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (
    field: keyof IApiNewsResponseItem,
    value: string
  ) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 truncate">
        Editar {record.title || "Record de Notícia"}
      </h1>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-0 lg:min-h-full">
          {/* Seção da Imagem */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6 flex flex-col items-center justify-start lg:border-r border-gray-200 dark:border-gray-700">
            <div className="w-full max-w-lg lg:sticky lg:top-6">
              {/* Imagem atual */}
              {croppedImage || record.image ? (
                <div className="mb-4 md:mb-6">
                  <img
                    src={croppedImage || record.image}
                    alt="Preview"
                    className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg"
                    style={{ aspectRatio: "16/9" }}
                  />
                  <div className="mt-2 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    Aspect ratio: 16:9 (TV)
                  </div>
                </div>
              ) : (
                <div
                  className="mb-4 md:mb-6 w-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600"
                  style={{ aspectRatio: "16/9" }}
                >
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <LuImageUp size={32} className="md:w-12 md:h-12 mx-auto mb-2" />
                    <p className="text-sm md:text-base">Nenhuma imagem selecionada</p>
                  </div>
                </div>
              )}

              {/* Botão de upload */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 p-3 md:p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-sm md:text-base"
              >
                <LuImageUp size={16} className="md:w-5 md:h-5 mr-2" />
                {croppedImage || record.image
                  ? "Alterar Imagem"
                  : "Fazer Upload de Imagem"}
              </Button>
            </div>
          </div>

          {/* Seção do Formulário */}
          <div className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6 max-w-2xl">
              {/* Título */}
              <FormInput
                label="Título"
                value={record.title}
                onChange={(value) => handleInputChange("title", value)}
                icon={LuFileText}
              />

              {/* Descrição */}
              <FormTextArea
                label="Descrição"
                value={record.description}
                onChange={(value) => handleInputChange("description", value)}
                rows={3}
              />

              {/* Autor */}
              <FormInput
                label="Autor"
                value={record.author || ""}
                onChange={(value) => handleInputChange("author", value)}
                icon={LuUser}
              />

              {/* URL */}
              <FormUrlInput
                label="URL"
                value={record.url}
                onChange={(value) => handleInputChange("url", value)}
              />

              {/* Fonte */}
              <FormInput
                label="Fonte"
                value={record.source_name || ""}
                onChange={(value) => handleInputChange("source_name", value)}
                icon={LuTag}
              />

              {/* Data de Publicação */}
              <FormDateTimeInput
                label="Data de Publicação"
                value={record.published_at}
                onChange={(value) => handleInputChange("published_at", value)}
              />

              {/* Provider */}
              <FormSelect
                label="Provider"
                value={record.provider || ""}
                onChange={(value) => handleInputChange("provider", value)}
                options={[
                  { value: "NEWS_API", label: "NEWS_API" },
                  { value: "LESAMPA", label: "LESAMPA" },
                ]}
                placeholder="Selecione um provider"
              />

              {/* Botão de Atualizar */}
              <div className="pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  {isUpdating ? "Atualizando..." : "Atualizar Record"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Crop */}
      {uploadedImage && (
        <Modal
          isOpen={cropModal.isOpen}
          onClose={cropModal.closeModal}
          showCloseButton={false}
          className="max-w-[95vw] md:max-w-[80vw] p-4 md:p-6 bg-white dark:bg-gray-900"
        >
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
            Recortar Imagem (16:9)
          </h2>

          <div className="relative w-full h-[50vh] md:max-h-[60vh] bg-gray-900 aspect-video">
            <Cropper
              image={uploadedImage}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
            <Button
              variant="outline"
              onClick={cropModal.closeModal}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCropConfirm}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white order-1 sm:order-2"
            >
              Confirmar Recorte
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
