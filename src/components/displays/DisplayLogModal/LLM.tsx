import React, { useState, useRef, useEffect } from "react";

export const GeminiStreamComponent = ({ id }: { id: string }) => {
  const [prompt, setPrompt] = useState<string>(
    "Conte uma história curta sobre um robô que descobre a música."
  );
  const [generatedText, setGeneratedText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup do EventSource quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const url = `${process.env.NEXT_PUBLIC_BASE_API_URL}/display/generate-insights?id=${id}`;

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
    <div
      style={{
        fontFamily: "sans-serif",
        padding: "20px",
        maxWidth: "700px",
        margin: "auto",
      }}
    >
      <h1>Teste de Stream com NestJS e Gemini</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          placeholder="Digite seu prompt aqui..."
        />
        <button
          type="submit"
          disabled={isStreaming}
          style={{ padding: "10px 20px", marginTop: "10px" }}
        >
          {isStreaming ? "Gerando..." : "Enviar"}
        </button>
      </form>

      <div style={{ marginTop: "20px" }}>
        <h2>Resposta do Gemini:</h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            background: "#f4f4f4",
            padding: "15px",
            borderRadius: "5px",
            minHeight: "100px",
          }}
        >
          {generatedText}
          {
            isStreaming && (
              <span className="cursor">|</span>
            ) /* Efeito de cursor */
          }
        </pre>
      </div>

      <style>{`
        .cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          from, to { color: transparent; }
          50% { color: black; }
        }
      `}</style>
    </div>
  );
};
