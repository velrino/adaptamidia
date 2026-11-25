import { LoadingButton } from "@/components/ui/loading-button";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { IApiDisplayLogItem } from "@/backend/api/api.interface";
import Select from "@/components/form/Select";
import { LLMModelsAsOptions, LLMModelsEnum } from "@/backend/api/api.enum";
import { useSession } from "next-auth/react";

export const DisplayLogLLMStreamComponent = ({
  record,
}: {
  record: IApiDisplayLogItem;
}) => {
  const { data: session } = useSession();
  const [generatedText, setGeneratedText] = useState(record.llm_insight ?? "");
  const [llmModelUsed, setLlmModelUsed] = useState(record.llm_insight_model ?? "");
  const [llmSelected, setLLMSelected] = useState(
    LLMModelsAsOptions.find(({ value }) => value === record.llm_insight_model)
      ?.value ?? LLMModelsEnum.DEFAULT
  );
  const [streamedText, setStreamedText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayedText = streamedText ?? generatedText;

  useEffect(() => () => eventSourceRef.current?.close(), []);

  useEffect(() => {
    if (scrollRef.current && streamedText) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamedText]);

  const handleSubmit = () => {
    if (eventSourceRef.current) return;

    const token = session?.api_session?.access_token;
    if (!token) {
      setError("Entre novamente para gerar insights.");
      return;
    }

    let text = "";
    let model = "";
    setError("");
    setStreamedText("");

    const finish = (message?: string) => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setStreamedText(null);
      if (message) {
        setError(message);
        return;
      }
      setGeneratedText(text);
      setLlmModelUsed(
        model || (llmSelected === LLMModelsEnum.DEFAULT ? "" : llmSelected)
      );
    };

    try {
      const query = new URLSearchParams({
        id: record._id,
        model: llmSelected,
        token,
      });
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/display/generate-insights?${query}`
      );
      eventSourceRef.current = eventSource;
      eventSource.addEventListener("insight-model", (event) => {
        model = event.data;
      });
      eventSource.addEventListener("insight-error", (event) =>
        finish(event.data)
      );
      eventSource.onmessage = (event) => {
        if (event.data === "[DONE]") {
          finish();
          return;
        }
        text += event.data;
        setStreamedText(text);
      };
      eventSource.onerror = () =>
        finish("Erro ao conectar com o servidor. Tente novamente.");
    } catch {
      finish("Erro ao conectar com o servidor. Tente novamente.");
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center items-center gap-4 w-full my-5">
        <div className="min-w-[200px]">
          <Select
            options={LLMModelsAsOptions}
            defaultValue={llmSelected}
            placeholder="Modelo LLM"
            onChange={(value) => setLLMSelected(value as LLMModelsEnum)}
            className="dark:bg-dark-900 w-full"
          />
        </div>

        <LoadingButton
          onClick={handleSubmit}
          loading={streamedText !== null}
          icon={Sparkles}
          variant="primary"
          className="h-[40px] mt-auto"
        >
          Gerar insights com IA
        </LoadingButton>
      </div>

      {error && (
        <p role="alert" className="text-center text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      {streamedText === null && llmModelUsed && (
        <div className="text-center text-sm text-gray-500 mb-4 gap-1 flex justify-center">
          <div>Modelo usado</div>
          <div className="font-mono text-purple-600 dark:text-purple-400">
            {LLMModelsAsOptions.find(({ value }) => value === llmModelUsed)
              ?.label || llmModelUsed}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="overflow-y-auto">
        <MarkdownPreview
          source={displayedText}
          style={{ padding: 16, background: "transparent", textAlign: "left" }}
          className="[&_*]:text-black [&_*]:dark:text-white"
        />
      </div>
    </div>
  );
};
