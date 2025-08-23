"use client";

import {
  IApiCreateNews,
  IApiNewsResponseItem,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { useToast } from "@/context/ToastContext";
import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import { LuImageUp, LuUser, LuTag, LuFileText } from "react-icons/lu";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { IToastType } from "@/interfaces/general";
import { Activity, FileText } from "lucide-react";
import {
  FormInput,
  FormTextArea,
  FormUrlInput,
  FormDateTimeInput,
  FormSelect,
} from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useLoading } from "@/context/LoadingContext";
import { RegionsComponent } from "@/components/regions/Regions";
import { NewRecordMetricsTab } from "./NewRecordMetrics";
import DisplaysTable from "@/components/displays/DisplaysTable";
import { API } from "@/backend/api/api.endpoints";
import {
  LanguageAsOptions,
  LanguageEnum,
  NewsKeywordAsOptions,
  NewsProviderEnum,
  NewsProviderOptions,
  NewsStatusAsOptions,
  NewsStatusEnum,
} from "@/interfaces/news";
import { GetErrorMessage } from "@/utils/generic";

interface NewRecordProps {
  recordInformed?: IApiNewsResponseItem | null;
  isCreateModeInformed?: boolean;
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

const defaultNewRecord: IApiNewsResponseItem = {
  _id: String(),
  provider: NewsProviderEnum.LESAMPA,
  language: LanguageEnum.PT_BR,
  keyword: String(),
  source_id: null,
  source_name: String(),
  author: String(),
  title: String(),
  description: String(),
  url: String(),
  image: String(),
  status: NewsStatusEnum.ACTIVE,
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  units: [],
  neighborhood: [],
};

enum TabName {
  overview = "overview",
  metrics = "metrics",
  displays = "displays",
}

export default function NewRecord({
  recordInformed,
  isCreateModeInformed = false,
}: NewRecordProps) {
  const { data: session } = useSession();

  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();

  const [isCreateMode, setIsCreateMode] =
    useState<boolean>(isCreateModeInformed);

  const [record, setRecord] = useState<IApiNewsResponseItem>(
    isCreateMode
      ? defaultNewRecord
      : recordInformed
      ? { ...defaultNewRecord, ...recordInformed }
      : defaultNewRecord
  );
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRequired, setIsRequired] = useState(true);

  const { showToast } = useToast();
  const cropModal = useModal();
  const deleteModal = useModal();
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

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!session?.api_session) {
      return;
    }

    if (!record?.provider) {
      showToast("Escolha um provedor!", IToastType.INFO);
      return;
    }

    try {
      showFullScreenLoading();
      const response = await API.files.upload(
        session.api_session.access_token,
        {
          file: croppedBlob,
          // company_id: "",
          foldername: `news/${record.provider}`,
          bucket: "adapta-midia",
        }
      );

      const responseData = await response.json();

      if (responseData?.error && responseData?.message) {
        showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
      } else if (response.ok && responseData?.file?.public_url) {
        showToast(`Upload feito com sucesso!`, IToastType.SUCCESS);

        // const croppedUrl = URL.createObjectURL(croppedBlob);
        setCroppedImage(responseData?.file?.public_url);
        setRecord((prev) => ({
          ...prev,
          image: responseData?.file?.public_url,
        }));
      } else {
        showToast(`Failed upload!`, IToastType.ERROR);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    } finally {
      hideFullScreenLoading();
    }
  };

  const handleCropConfirm = async () => {
    if (uploadedImage && croppedAreaPixels) {
      try {
        const croppedBlob = await getCroppedImg(
          uploadedImage,
          croppedAreaPixels
        );
        await handleCroppedImage(croppedBlob);
        cropModal.closeModal();
      } catch (error) {
        console.log({ error });
        showToast("Erro ao recortar imagem", IToastType.ERROR);
      }
    }
  };

  const handleUpdate = async () => {
    if (!session?.api_session?.access_token) {
      return;
    }

    showFullScreenLoading();
    setIsUpdating(true);

    try {
      const { _id, created_at, updated_at, ...rest } = record;

      const body: IApiCreateNews = rest as IApiCreateNews;

      // const body: IApiCreateNews = {
      //   ...(record as any),
      //   author: record.author || "",
      //   description: record.description || "",
      //   image: record.image || "",
      //   keyword: record.keyword || "",
      //   language: record.language || "",
      //   provider: record.provider || "",
      //   published_at: record.published_at || new Date().toISOString(),
      //   source_id: record.source_id || "",
      //   source_name: record.source_name || "",
      //   title: record.title || "",
      //   url: record.url || "https://seemedia.com/",
      //   units: record.units || [],
      //   neighborhood: record.neighborhood || [],
      // };

      let response: Response = {} as Response;

      if (isCreateMode) {
        response = await API.news.create(
          session.api_session.access_token,
          body
        );
      } else if (record._id && !isCreateMode) {
        response = await API.news.update(
          session.api_session.access_token,
          record._id,
          body
        );
      }

      if (!response) {
        throw new Error("No response from server");
      }

      const responseData = await response.json();

      if (responseData?.error) {
        showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
      } else if (response.ok) {
        if (isCreateMode && responseData?._id?.length) {
          setIsCreateMode(false);
          setRecord((prev) => ({
            ...prev,
            ...responseData,
          }));
          showToast("Notícia criada com sucesso!", IToastType.SUCCESS);
        } else {
          showToast("Notícia atualizado com sucesso!", IToastType.SUCCESS);
        }
      }
    } catch (error) {
      console.log({ error });
      showToast("Erro ao atualizar record", IToastType.ERROR);
    } finally {
      setIsUpdating(false);
      hideFullScreenLoading();
    }
  };

  const handleDelete = async () => {
    if (!session?.api_session?.access_token || !record._id) {
      return;
    }

    setIsDeleting(true);
    showFullScreenLoading();

    try {
      const response = await API.news.delete(
        session.api_session.access_token,
        record._id
      );

      if (response.ok) {
        showToast("Notícia deletada com sucesso!", IToastType.SUCCESS);
        deleteModal.closeModal();
        // Redirect or refresh list after deletion
        window.location.href = "/news";
      } else {
        const responseData = await response.json();
        showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
      }
    } catch (error) {
      console.log({ error });
      showToast("Erro ao deletar notícia", IToastType.ERROR);
    } finally {
      setIsDeleting(false);
      hideFullScreenLoading();
    }
  };

  const handleInputChange = (
    field: keyof IApiNewsResponseItem,
    value: string
  ) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
  };

  const handleNeighborhoodChange = useCallback((neighborhoods: string[]) => {
    setRecord((prev) => ({
      ...prev,
      neighborhood: neighborhoods,
    }));
  }, []);

  const handleUnitsChange = useCallback((newUnits: IApiUnitItemResponse[]) => {
    setRecord((prev) => ({
      ...prev,
      units: newUnits.map((unit) => unit._id),
    }));
  }, []);

  const tabs = [
    { id: TabName.overview, label: "Conteúdo", icon: Activity },
    ...(record?._id?.length
      ? [
          { id: TabName.metrics, label: "Métricas", icon: FileText },
          { id: TabName.displays, label: "Exibições", icon: FileText },
        ]
      : []),
  ];

  const [activeTab, setActiveTab] = useState<TabName>(TabName.overview);

  useEffect(() => {
    if (record) {
      if (!record.image || !record.image.length) {
        setIsRequired(true);
      } else if (record.image && record.image.length) {
        setIsRequired(false);
      }
    }
  }, [record]);

  return (
    <>
      {record && (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 truncate">
            {isCreateMode && record?.title
              ? `Criar ${record?.title || "Record de Notícia"}`
              : `Editar ${record?.title || "Record de Notícia"}`}
          </h1>

          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-0 justify-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {activeTab === TabName.overview && (
            <>
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
                            <LuImageUp
                              size={32}
                              className="md:w-12 md:h-12 mx-auto mb-2"
                            />
                            <p className="text-sm md:text-base">
                              Nenhuma imagem selecionada
                            </p>
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
                      {/* Provider */}
                      <FormSelect
                        label="Provider"
                        value={record.provider || ""}
                        onChange={(value) =>
                          handleInputChange("provider", value)
                        }
                        options={NewsProviderOptions}
                        placeholder="Selecione um provider"
                      />

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
                        onChange={(value) =>
                          handleInputChange("description", value)
                        }
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
                        onChange={(value) =>
                          handleInputChange("source_name", value)
                        }
                        icon={LuTag}
                      />

                      {/* Data de Publicação */}
                      {!isCreateMode && (
                        <FormDateTimeInput
                          label="Data de Publicação"
                          value={record.published_at}
                          onChange={(value) =>
                            handleInputChange("published_at", value)
                          }
                        />
                      )}

                      <FormDateTimeInput
                        label="Parar de exibir em"
                        value={record.end_at}
                        onChange={(value) => handleInputChange("end_at", value)}
                      />

                      {/* Status */}
                      <FormSelect
                        label="Status"
                        value={record.status || ""}
                        onChange={(value) => handleInputChange("status", value)}
                        options={NewsStatusAsOptions}
                        placeholder="Selecione um status"
                      />

                      {/* Language */}
                      <FormSelect
                        label="Idioma"
                        value={record.language || ""}
                        onChange={(value) =>
                          handleInputChange("language", value)
                        }
                        options={LanguageAsOptions}
                        placeholder="Selecione um idioma"
                      />

                      {/* Keyword */}
                      <FormSelect
                        label="Palavra-chave"
                        value={record.keyword || ""}
                        onChange={(value) =>
                          handleInputChange("keyword", value)
                        }
                        options={NewsKeywordAsOptions}
                        placeholder="Selecione uma palavra-chave"
                      />

                      <RegionsComponent
                        neighborhoodInformed={record.neighborhood}
                        unitsInformed={record.units || []}
                        onNeighborhoodChange={handleNeighborhoodChange}
                        onUnitsChange={handleUnitsChange}
                      />

                      {/* Botões de Atualizar e Deletar */}
                      <div className="pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-3">
                          <Button
                            onClick={handleUpdate}
                            disabled={isUpdating || isRequired}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                          >
                            {isUpdating
                              ? isCreateMode
                                ? "Criando..."
                                : "Atualizando..."
                              : isCreateMode
                              ? "Criar Notícia"
                              : "Atualizar Notícia"}
                          </Button>
                          {!isCreateMode && (
                            <Button
                              onClick={() => deleteModal.openModal()}
                              disabled={isUpdating || isDeleting}
                              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4"
                            >
                              Deletar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

              {/* Modal de Confirmação de Deleção */}
              <Modal
                isOpen={deleteModal.isOpen}
                onClose={deleteModal.closeModal}
                showCloseButton={false}
                className="max-w-md p-6 bg-white dark:bg-gray-900"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Confirmar Deleção
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Tem certeza que deseja deletar esta notícia? Esta ação não
                  pode ser desfeita.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={deleteModal.closeModal}
                    disabled={isDeleting}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                  >
                    {isDeleting ? "Deletando..." : "Deletar"}
                  </Button>
                </div>
              </Modal>
            </>
          )}

          {record?._id?.length && (
            <>
              {activeTab === TabName.metrics && (
                <>
                  <NewRecordMetricsTab id={record._id} />
                </>
              )}

              {activeTab === TabName.displays && (
                <>
                  <DisplaysTable
                    internalQuery={{
                      news: [record._id],
                    }}
                    className="mx-5 mt-2"
                  />
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
