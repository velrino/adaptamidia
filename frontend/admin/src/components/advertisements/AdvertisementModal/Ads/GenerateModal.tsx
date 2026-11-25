import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/context/ToastContext";
import { IUseModal } from "@/hooks/useModal";
import { IToastType } from "@/interfaces/general";
import { Delay } from "@/utils/generic";
import React, { useState, useRef, useEffect } from "react";
import { LuImagePlus } from "react-icons/lu";

interface MediaCropperModalProps {
  open: boolean;
  currentModal: IUseModal;
  onCropComplete: (video: string) => void;
}

export const GenerateAdvertisementModal: React.FC<MediaCropperModalProps> = ({
  open,
  currentModal,
  onCropComplete,
}) => {
  const { showToast } = useToast();

  // useEffect(() => {
  //   currentModal.openModal();
  // }, [currentModal]);

  const [prompt, setPromp] = useState<string>(String());
  const demoText = `A confident woman, speaks in a bright studio. She looks into the camera and says:\n\n"Criar um anúncio incrível em segundos?"\n\nThen, same angle and framing, the background seamlessly shifts to a Dubai rooftop at night. Now she finishes:\n\n"Crie com XMP Mídia!"`;
  const [demoTextIndex, setDemoTextIndex] = useState<number>(0);

  useEffect(() => {
    if (open) {
      if (demoTextIndex < demoText.length) {
        const timeout = setTimeout(() => {
          setPromp((prev) => prev + demoText[demoTextIndex]);
          setDemoTextIndex((prev) => prev + 1);
        }, 5);

        return () => clearTimeout(timeout);
      }
    }
  }, [demoTextIndex, demoText, open]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }

    if (prompt.length <= 1) {
      setPromptIsValid(false);
    } else {
      setPromptIsValid(true);
    }

    if (prompt.length === demoText.length) {
      const handleEffect = async () => {
        await Delay(1000);
        setIsGenerated(true);
        setPromptLoading(false);
      };

      setPromptLoading(true);
      handleEffect();
    }
  }, [prompt, demoText]);

  const [promptIsValid, setPromptIsValid] = useState<boolean>(false);
  const [promptLoading, setPromptLoading] = useState<boolean>(false);

  const submitPrompt = async () => {};

  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const videos = [
    {
      id: 1,
      src: "/videos/demo/1.mp4",
      title: "Video 1",
      autoPlay: true,
      loop: false,
    },
    {
      id: 2,
      src: "/videos/demo/2.mp4",
      title: "Video 2",
      autoPlay: true,
      loop: true,
    },
  ];

  const getSelectedVideoSrc = () => {
    if (selectedVideo === null) return null;
    return videos.find((video) => video.id === selectedVideo)?.src;
  };

  const afterSelectedVideo = async () => {
    const src = getSelectedVideoSrc();

    if (!src) {
      showToast("Escolha um vídeo!", IToastType.ERROR);
      return;
    }

    onCropComplete(src);
    currentModal.closeModal();
  };

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
        className="max-w-[50vw] p-6"
        isFullscreen={isGenerated}
      >
        <div
          className={
            isGenerated
              ? "fixed top-0 left-0 flex flex-col w-full h-screen p-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 lg:p-10"
              : ""
          }
        >
          <h4 className="font-semibold text-gray-800 mb-7 text-title-sm dark:text-white/90">
            {isGenerated ? "Seu anúncio foi gerado" : "Escreva seu prompt"}
          </h4>
          {!isGenerated && (
            <div>
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
          )}
          {isGenerated && (
            <div>
              <div className="grid grid-cols-12">
                <div className="col-span-12 flex justify-center">
                  <div className="w-full max-w-2xl">
                    <TextArea
                      rows={3}
                      value={prompt}
                      className="resize-none w-full"
                      disabled
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className={`
        relative 
        cursor-pointer 
        transition-all 
        duration-200
        min-h-[200px]
        h-full         
        overflow-visible 
        ${
          selectedVideo === video.id
            ? "ring-4 ring-blue-500"
            : "hover:ring-2 hover:ring-gray-300"
        }
      `}
                      onClick={() => setSelectedVideo(video.id)}
                    >
                      <div className="relative w-full h-full">
                        <video
                          src={video.src}
                          className="
            w-full 
            h-full 
            object-cover /* Mantém proporção cobrindo a área */
          "
                          controls
                          autoPlay
                          muted
                          loop
                        />

                        <div
                          className="
          absolute 
          inset-0 
          flex 
          items-center 
          justify-center 
          bg-black/10 
          hover:bg-black/20 
          transition-all 
          duration-200
        "
                        >
                          {selectedVideo === video.id && (
                            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                              Selecionado
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            className={
              isGenerated
                ? "fixed bottom-0 left-0 right-0 flex items-center justify-between w-full gap-3 p-6 bg-white dark:bg-gray-900 lg:p-10"
                : "flex justify-between mt-4"
            }
          >
            <Button variant="outline" onClick={currentModal.closeModal}>
              Cancelar
            </Button>

            {promptLoading ? (
              <Spinner color="#465fff" />
            ) : (
              <Button
                disabled={!promptIsValid}
                onClick={isGenerated ? afterSelectedVideo : submitPrompt}
              >
                {isGenerated ? "Aprovar" : "Gerar"}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
