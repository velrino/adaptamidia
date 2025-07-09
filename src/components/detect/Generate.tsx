import React, { useState } from "react";
import { Play, Download, Copy, RefreshCw } from "lucide-react";

const ComfyUIVideoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("testing");
  const [comfyuiUrl, setComfyuiUrl] = useState("/api/comfy");

  // Testar conexão na inicialização
  React.useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus("testing");

    try {
      // Método 1: Tentar conexão direta
      try {
        const response = await fetch(`${comfyuiUrl}/`, {
          method: "GET",
          mode: "cors",
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (response.ok) {
          setConnectionStatus("connected");
          setError("");
          return;
        }
      } catch (corsError) {
        console.log("Direct connection failed, trying proxy...");
      }

      // Método 2: Tentar via proxy
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
          comfyuiUrl
        )}`;
        const proxyResponse = await fetch(proxyUrl);

        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          if (data.contents) {
            setConnectionStatus("proxy");
            setError("");
            return;
          }
        }
      } catch (proxyError) {
        console.log("Proxy connection failed");
      }

      // Se chegou aqui, não conseguiu conectar
      setConnectionStatus("failed");
      setError(
        "❌ Não foi possível conectar ao ComfyUI. Verifique se está rodando e tente novamente."
      );
    } catch (err) {
      setConnectionStatus("failed");
      setError(`❌ Erro de conexão: ${err.message}`);
    }
  };

  const createVideoWorkflow = (promptText, seed = -1) => {
    return {
      "3": {
        inputs: {
          seed: seed === -1 ? Math.floor(Math.random() * 1000000) : seed,
          steps: 15,
          cfg: 7.0,
          sampler_name: "euler",
          scheduler: "normal",
          denoise: 1,
          model: ["4", 0],
          positive: ["6", 0],
          negative: ["7", 0],
          latent_image: ["5", 0],
        },
        class_type: "KSampler",
      },
      "4": {
        inputs: {
          ckpt_name: "v1-5-pruned-emaonly.ckpt",
        },
        class_type: "CheckpointLoaderSimple",
      },
      "5": {
        inputs: {
          width: 512,
          height: 512,
          batch_size: 8,
        },
        class_type: "EmptyLatentImage",
      },
      "6": {
        inputs: {
          text: promptText,
          clip: ["4", 1],
        },
        class_type: "CLIPTextEncode",
      },
      "7": {
        inputs: {
          text: "blurry, low quality, distorted, ugly",
          clip: ["4", 1],
        },
        class_type: "CLIPTextEncode",
      },
      "8": {
        inputs: {
          samples: ["3", 0],
          vae: ["4", 2],
        },
        class_type: "VAEDecode",
      },
      "9": {
        inputs: {
          filename_prefix: "video_output",
          images: ["8", 0],
        },
        class_type: "SaveImage",
      },
    };
  };

  const waitForCompletion = async (promptId, timeout = 300000) => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        let response;

        // Tentar método direto primeiro
        try {
          response = await fetch(`${comfyuiUrl}/history/${promptId}`, {
            mode: "cors",
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          });
        } catch (corsError) {
          // Usar proxy se CORS falhar
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
            comfyuiUrl + "/history/" + promptId
          )}`;
          const proxyResponse = await fetch(proxyUrl);
          const proxyData = await proxyResponse.json();

          // Simular response object
          response = {
            ok: true,
            json: () => JSON.parse(proxyData.contents),
          };
        }

        if (response.ok) {
          const history = await response.json();

          if (history[promptId] && history[promptId].outputs) {
            return history[promptId];
          }
        }

        // Atualizar progresso
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min((elapsed / timeout) * 100, 90);
        setProgress(progressPercent);

        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (err) {
        console.log("Checking status...", err.message);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    throw new Error("Timeout waiting for completion");
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError("Por favor, digite um prompt");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);

    try {
      // Criar workflow
      // const workflow = createVideoWorkflow(prompt);
      const workflow = {
        "6": {
          inputs: {
            text: prompt,
            clip: ["38", 0],
          },
          class_type: "CLIPTextEncode",
          _meta: {
            title: "CLIP Text Encode (Positive Prompt)",
          },
        },
        "7": {
          inputs: {
            text: "low quality, worst quality, deformed, distorted, disfigured, motion smear, motion artifacts, fused fingers, bad anatomy, weird hand, ugly",
            clip: ["38", 0],
          },
          class_type: "CLIPTextEncode",
          _meta: {
            title: "CLIP Text Encode (Negative Prompt)",
          },
        },
        "8": {
          inputs: {
            samples: ["72", 0],
            vae: ["44", 2],
          },
          class_type: "VAEDecode",
          _meta: {
            title: "VAE Decode",
          },
        },
        "38": {
          inputs: {
            clip_name: "t5xxl_fp16.safetensors",
            type: "ltxv",
            device: "default",
          },
          class_type: "CLIPLoader",
          _meta: {
            title: "Load CLIP",
          },
        },
        "41": {
          inputs: {
            filename_prefix: "ComfyUI",
            fps: 24,
            lossless: false,
            quality: 90,
            method: "default",
            images: ["8", 0],
          },
          class_type: "SaveAnimatedWEBP",
          _meta: {
            title: "SaveAnimatedWEBP",
          },
        },
        "44": {
          inputs: {
            ckpt_name: "ltx-video-2b-v0.9.safetensors",
          },
          class_type: "CheckpointLoaderSimple",
          _meta: {
            title: "Load Checkpoint",
          },
        },
        "69": {
          inputs: {
            frame_rate: 25,
            positive: ["6", 0],
            negative: ["7", 0],
          },
          class_type: "LTXVConditioning",
          _meta: {
            title: "LTXVConditioning",
          },
        },
        "70": {
          inputs: {
            width: 768,
            height: 512,
            length: 97,
            batch_size: 1,
          },
          class_type: "EmptyLTXVLatentVideo",
          _meta: {
            title: "EmptyLTXVLatentVideo",
          },
        },
        "71": {
          inputs: {
            steps: 30,
            max_shift: 2.05,
            base_shift: 0.95,
            stretch: true,
            terminal: 0.1,
            latent: ["70", 0],
          },
          class_type: "LTXVScheduler",
          _meta: {
            title: "LTXVScheduler",
          },
        },
        "72": {
          inputs: {
            add_noise: true,
            noise_seed: 18628476853112,
            cfg: 3,
            model: ["44", 0],
            positive: ["69", 0],
            negative: ["69", 1],
            sampler: ["73", 0],
            sigmas: ["71", 0],
            latent_image: ["70", 0],
          },
          class_type: "SamplerCustom",
          _meta: {
            title: "SamplerCustom",
          },
        },
        "73": {
          inputs: {
            sampler_name: "euler",
          },
          class_type: "KSamplerSelect",
          _meta: {
            title: "KSamplerSelect",
          },
        },
        "80": {
          inputs: {
            frame_rate: 24,
            loop_count: 0,
            filename_prefix: "ComfyUI",
            format: "video/h265-mp4",
            pix_fmt: "yuv420p10le",
            crf: 22,
            save_metadata: true,
            pingpong: false,
            save_output: true,
          },
          class_type: "VHS_VideoCombine",
          _meta: {
            title: "Video Combine 🎥🅥🅗🅢",
          },
        },
      };

      setProgress(10);

      // Enviar prompt
      let response;
      try {
        response = await fetch(`${comfyuiUrl}/prompt`, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            prompt: workflow,
            client_id: `react_client_${Date.now()}`,
          }),
        });
      } catch (corsError) {
        console.log("CORS error, trying proxy method...");

        // Método 2: Usar proxy público para contornar CORS
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
          comfyuiUrl + "/prompt"
        )}`;

        response = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: workflow,
            client_id: `react_client_${Date.now()}`,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      const promptId = data.prompt_id;

      setProgress(20);

      // Aguardar conclusão
      const completion = await waitForCompletion(promptId);

      setProgress(95);

      // Processar resultados
      const outputs = completion.outputs;
      const imageFiles = [];

      for (const [nodeId, nodeOutput] of Object.entries(outputs)) {
        if (nodeOutput.images) {
          for (const imageInfo of nodeOutput.images) {
            imageFiles.push({
              filename: imageInfo.filename,
              subfolder: imageInfo.subfolder || "",
              type: imageInfo.type || "output",
            });
          }
        }
      }

      if (imageFiles.length > 0) {
        setResult({
          promptId,
          images: imageFiles,
          prompt: prompt,
        });
        setProgress(100);
      } else {
        throw new Error("Nenhuma imagem gerada");
      }
    } catch (err) {
      setError(`Erro: ${err.message}`);
      console.error("Generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageFile) => {
    const params = new URLSearchParams({
      filename: imageFile.filename,
      subfolder: imageFile.subfolder,
      type: imageFile.type,
    });
    return `${comfyuiUrl}/view?${params}`;
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  const downloadImage = async (imageFile, index) => {
    try {
      const url = getImageUrl(imageFile);
      const response = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });
      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `generated_${index + 1}_${imageFile.filename}`;
      link.click();
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold  mb-2">ComfyUI Video Generator</h1>
          <p className="text-purple-200">
            Gere vídeos incríveis usando texto com Inteligência Artificial
          </p>

          {/* Connection Status */}
          <div className="mt-4">
            {connectionStatus === "testing" && (
              <div className="inline-flex items-center bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2">
                <RefreshCw className="animate-spin mr-2" size={16} />
                <span className="text-yellow-200">Testando conexão...</span>
              </div>
            )}

            {connectionStatus === "connected" && (
              <div className="inline-flex items-center bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-green-200">✅ Conectado ao ComfyUI</span>
              </div>
            )}

            {connectionStatus === "proxy" && (
              <div className="inline-flex items-center bg-blue-500/20 border border-blue-500/50 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span className="text-blue-200">🔄 Conectado via proxy</span>
              </div>
            )}

            {connectionStatus === "failed" && (
              <div className="inline-flex items-center bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                <span className="text-red-200">❌ Falha na conexão</span>
                <button
                  onClick={testConnection}
                  className="ml-3 bg-red-500/30 hover:bg-red-500/50 px-3 py-1 rounded text-sm transition-colors"
                >
                  Reconectar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold  mb-4 flex items-center">
                <Play className="mr-2" size={20} />
                Prompt para o Vídeo
              </h2>

              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Digite sua descrição aqui... ex: 'a cat walking in a beautiful garden with flowers, sunny day, realistic'"
                    className="w-full h-32 p-4 bg-black/20 border border-white/30 rounded-lg  placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    onClick={copyPrompt}
                    className="absolute top-2 right-2 p-2 text-gray-300 hover: transition-colors"
                    title="Copiar prompt"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={generateVideo}
                    disabled={
                      loading || !prompt.trim() || connectionStatus === "failed"
                    }
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed  font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin mr-2" size={18} />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2" size={18} />
                        Gerar Vídeo
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Bar */}
                {loading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Progresso</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold  mb-3">Configurações</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Resolução:</span>
                  <p className=" font-medium">512x512</p>
                </div>
                <div>
                  <span className="text-gray-300">Frames:</span>
                  <p className=" font-medium">8 imagens</p>
                </div>
                <div>
                  <span className="text-gray-300">Steps:</span>
                  <p className=" font-medium">15</p>
                </div>
                <div>
                  <span className="text-gray-300">CFG:</span>
                  <p className=" font-medium">7.0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 min-h-96">
              <h2 className="text-xl font-semibold  mb-4">Resultado</h2>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                  </div>
                  <p className=" font-medium mb-2">Gerando vídeo...</p>
                  <p className="text-gray-300 text-sm">
                    Isso pode levar alguns minutos
                  </p>
                </div>
              )}

              {/* Results */}
              {result && !loading && (
                <div className="space-y-4">
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                    <p className="text-green-200 text-sm">
                      ✅ Vídeo gerado com sucesso! {result.images.length} frames
                      criados
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {result.images.map((imageFile, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getImageUrl(imageFile)}
                          alt={`Frame ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-white/20"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => downloadImage(imageFile, index)}
                            className="bg-white/20 hover:bg-white/30  p-2 rounded-full transition-colors"
                            title={`Download frame ${index + 1}`}
                          >
                            <Download size={16} />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/70  text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/20">
                    <p className="text-gray-300 text-sm mb-2">Prompt usado:</p>
                    <p className=" bg-black/20 p-3 rounded-lg text-sm">
                      "{result.prompt}"
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !result && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <Play className="" size={24} />
                  </div>
                  <p className=" font-medium mb-2">Pronto para gerar</p>
                  <p className="text-gray-300 text-sm">
                    Digite um prompt e clique em "Gerar Vídeo"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-purple-200 text-sm">
            Powered by ComfyUI • Para hackathons e projetos criativos
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComfyUIVideoGenerator;
