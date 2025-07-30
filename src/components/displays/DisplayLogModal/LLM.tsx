import { LoadingButton } from "@/components/ui/loading-button";
import { Sparkles } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { IApiDisplayLogItem } from "@/backend/api/api.interface";
import Select from "@/components/form/Select";
import { LLMModelsAsOptions, LLMModelsEnum } from "@/backend/api/api.enum";

export const DisplayLogLLMStreamComponent = ({
  record,
}: {
  record: IApiDisplayLogItem;
}) => {
  const [generatedText, setGeneratedText] = useState<string>(
    record?.llm_insight || String()
  );

  const [llmModelUsed, setLlmModelUsed] = useState<string>(
    record?.llm_insight_model || String()
  );

  const [llmSelected, setLLMSelected] = useState<LLMModelsEnum | string>(
    record?.llm_insight_model || LLMModelsEnum.GEMINI_2_0_FLASH_001
  );
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [loadingLLM, setLoadingLLM] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cleanup do EventSource quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Auto-scroll quando generatedText é atualizado
  useEffect(() => {
    if (scrollRef.current && generatedText) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [generatedText]);

  const handleSubmit = async () => {
    setLoadingLLM(true);

    if (isStreaming) return;

    // Limpa o texto anterior e define o estado de carregamento
    setGeneratedText("");
    setIsStreaming(true);

    // Usa EventSource para conectar ao endpoint SSE do NestJS
    await handleStreamWithEventSource();
  };

  // Função que usa EventSource para lidar com o stream SSE
  const handleStreamWithEventSource = async () => {
    // const encodedPrompt = encodeURIComponent(prompt);
    const url = `${process.env.NEXT_PUBLIC_BASE_API_URL}/display/generate-insights?id=${record._id}&model=${llmSelected}`;

    try {
      // Fecha EventSource anterior se existir
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = event.data;

        if (data === "[DONE]") {
          setIsStreaming(false);
          eventSource.close();
          eventSourceRef.current = null;
          setLoadingLLM(false);
          setLlmModelUsed(llmSelected);
          return;
        }

        // Adiciona o texto recebido
        if (data) {
          setGeneratedText((prev) => prev + data);
        }
      };

      eventSource.onerror = (error) => {
        console.error("Erro no EventSource:", error);
        setIsStreaming(false);
        setGeneratedText("Erro ao conectar com o servidor. Tente novamente.");
        eventSource.close();
        eventSourceRef.current = null;
      };

      eventSource.onopen = () => {
        console.log("Conexão SSE estabelecida");
      };
    } catch (error) {
      console.error("Erro ao criar EventSource:", error);
      setIsStreaming(false);
      setGeneratedText("Erro ao conectar com o servidor. Tente novamente.");
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center items-center gap-4 w-full my-5">
        <div className="min-w-[200px]">
          {/* <Label>Modelo</Label> */}
          <Select
            options={LLMModelsAsOptions}
            defaultValue={llmSelected}
            placeholder="Modelo LLM"
            onChange={(value: string) => {
              setLLMSelected(value as LLMModelsEnum);
            }}
            className="dark:bg-dark-900 w-full"
          />
        </div>

        <LoadingButton
          onClick={handleSubmit}
          loading={loadingLLM}
          icon={Sparkles}
          variant="primary"
          className="h-[40px] mt-auto"
        >
          Gerar insights com IA
        </LoadingButton>
      </div>

      {!loadingLLM && llmModelUsed && (
        <div className="text-center text-sm text-gray-500 mb-4 gap-1 flex justify-center">
          <div>Powered by</div>
          <div className="font-mono text-purple-600 dark:text-purple-400">
            {llmModelUsed}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="overflow-y-auto">
        <MarkdownPreview
          source={generatedText}
          style={{ padding: 16, background: "transparent", textAlign: "left" }}
          className="[&_*]:text-black [&_*]:dark:text-white"
        />
      </div>
    </div>
  );
};
