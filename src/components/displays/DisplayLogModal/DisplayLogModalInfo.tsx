/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import {
  Eye,
  MapPin,
  Clock,
  Users,
  Image as ImageIcon,
  Cpu,
  Activity,
  BarChart3,
  FileText,
  Target,
  Globe,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { IApiDisplayLogItem } from "@/backend/api/api.interface";
import { DateHelper } from "@/utils/date";
import { API } from "@/backend/api/api.endpoints";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { LoadingButton } from "@/components/ui/loading-button";
import { IToastType } from "@/interfaces/general";
import { GetErrorMessage } from "@/utils/generic";
import { DisplayLogLLMStreamComponent } from "./LLM";

interface DisplayLogModalInfoProps {
  recordInformed: IApiDisplayLogItem;
}

type TabType = "overview" | "analytics" | "content" | "insights";

function CaptureDisplay({ capture, title }: { capture?: any; title?: string }) {
  const [imageError, setImageError] = useState(false);

  if (!capture) return <></>;

  return (
    <div className="space-y-2">
      {title && (
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {title}
        </p>
      )}
      <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-inner">
        {!imageError ? (
          <img
            src={capture}
            alt={title || "Captura da exibição"}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-center">
            <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Captura não disponível
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DisplayLogModalInfo({
  recordInformed,
}: DisplayLogModalInfoProps) {
  const [record, setRecord] = useState<IApiDisplayLogItem>(recordInformed);

  const { showToast } = useToast();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loadingVisual, setLoadingVisual] = useState(false);

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    return status === "DETECTION_INSIGHTFACE"
      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400"
      : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-800 dark:to-slate-800 dark:text-gray-300";
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "NEWS":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-400";
      case "ADVERTISEMENT":
        return "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-400";
      default:
        return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-800 dark:to-slate-800 dark:text-gray-300";
    }
  };

  const handleVisualComputation = async () => {
    if (!session?.api_session) {
      return;
    }

    setLoadingVisual(true);

    try {
      const response = await API.display_logs.detect(
        session.api_session.access_token,
        {
          id: record._id,
        }
      );

      const currentData = await response.json();

      if (currentData?.error && currentData?.message) {
        showToast(GetErrorMessage(currentData.message), IToastType.ERROR);
      } else if (response.ok && currentData?.result._id) {
        showToast(`Detecção visual concluída com sucesso!`, IToastType.SUCCESS);
        setRecord(currentData.result);
      } else {
        showToast("FAILED", IToastType.ERROR);
      }
    } catch (error) {
      showToast(GetErrorMessage(error), IToastType.ERROR);
    } finally {
      setLoadingVisual(false);
    }
  };

  // const handleLLMInsights = async () => {
  //   setLoadingLLM(true);
  //   // Simulate API call
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   setLoadingLLM(false);
  //   showToast("EM DEV", IToastType.INFO);
  // };

  const isAdvertisement =
    record.type === "ADVERTISEMENT" && record.advertisement;
  const isNews = record.type === "NEWS" && record.news;

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: Activity },
    { id: "content", label: "Conteúdo", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "insights", label: "Insights", icon: Sparkles },
  ];

  return (
    <div className=" py-6 transition-all duration-300">
      {/* Main Container */}
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {record.type === "NEWS" ? (
                    <Globe className="w-6 h-6" />
                  ) : (
                    <Target className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Log de Exibição</h1>
                  <p className="text-sm text-blue-200 dark:text-blue-100">
                    <span className="font-medium">
                      {record.type === "NEWS" ? "Notícia" : "Anúncio"}
                    </span>
                    <span className="mx-1">•</span>
                    <span>{DateHelper.format(record.start_at)}</span>
                    <span className="ml-1 text-xs text-blue-300 dark:text-blue-400">
                      ({DateHelper.timeAgo(record.start_at)})
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right mt-5">
                <div className="font-mono text-lg">
                  Identifier: {record.identifier}
                </div>
                <div className="font-mono text-sm">ID: {record._id}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                  record.type
                )} backdrop-blur-sm`}
              >
                {record.type}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  record.status
                )} backdrop-blur-sm`}
              >
                {record.status.replace("DETECTION_", "")}
              </span>
              <div className="flex items-center space-x-2 text-blue-100">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{record.local_unit.name}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
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
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Location Info */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 h-full border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Local
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {record.local_unit.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {record.local_unit.full_address}
                      </p>
                    </div>
                    <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                      {record.local_unit.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time & Duration */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 h-full border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Tempo
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatDuration(record.seconds)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Duração
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {new Date(record.start_at).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Início
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 h-full border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Detecção
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Pessoas
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {record.insightface?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confiança
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {record.yolo?.confidence
                          ? Math.round(record.yolo.confidence * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {/* <div className="lg:col-span-3 mt-6">
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    Análises Avançadas
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <LoadingButton
                      onClick={handleLLMInsights}
                      loading={loadingLLM}
                      icon={Brain}
                      variant="secondary"
                    >
                      Gerar Insights com LLM
                    </LoadingButton>
                  </div>
                </div>
              </div> */}
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-6">
              {isNews && (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Notícia
                        </h2>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{record.news!.source_name}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{record.news!.author}</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 leading-relaxed">
                      {record.news!.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                      {record.news!.description}
                    </p>

                    {record.news!.image && (
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={record.news!.image}
                          alt="News thumbnail"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {isAdvertisement && (
                <>
                  <div className="rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Anúncio ({formatDuration(record.seconds)})
                        </h2>
                        {record.advertiser && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            ID: {record.advertiser}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Advertisement Items */}
                    <div className="space-y-4">
                      {record.advertisement!.items.map((item, index) => (
                        <div key={index} className="rounded-xl p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 leading-relaxed">
                                {record.advertisement!.title}
                              </h3>

                              {record.advertisement!.description && (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                  {record.advertisement!.description}
                                </p>
                              )}

                              {item.title && (
                                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                  {item.title}
                                </h5>
                              )}

                              {item.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-lg p-3 flex items-center justify-center">
                              <div className="text-center">
                                {record.advertisement &&
                                item.type === "VIDEO" ? (
                                  <>
                                    <video
                                      src={
                                        record.advertisement.items[0]?.source ||
                                        "/placeholder.svg"
                                      }
                                      autoPlay
                                      loop
                                      muted
                                      className="w-100 h-full object-cover"
                                      style={{ objectPosition: "center" }}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Preview da imagem
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <>
              <div className="flex items-center justify-center my-10">
                <LoadingButton
                  onClick={handleVisualComputation}
                  loading={loadingVisual}
                  icon={Cpu}
                  variant="primary"
                >
                  Executar Computação Visual
                </LoadingButton>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Audience Analytics */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Análise de Audiência
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {record.insightface?.total || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Pessoas Detectadas
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {record.insightface?.age?.average || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Idade Média
                      </div>
                    </div>
                    {/* <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {record.yolo?.confidence
                          ? Math.round(record.yolo.confidence * 100)
                          : 0}
                        %
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Confiança YOLO
                      </div>
                    </div> */}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Homens
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {record.insightface?.men || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mulheres
                      </span>
                      <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                        {record.insightface?.women || 0}
                      </span>
                    </div>
                    {record.insightface?.age && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Faixa Etária
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>Min: {record.insightface.age.min}</span>
                          <span>Máx: {record.insightface.age.max}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Capture Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Capturas da Exibição
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {record.capture && (
                      <CaptureDisplay
                        capture={record.capture}
                        title="Captura Principal"
                      />
                    )}

                    {record.capture_bbox &&
                      typeof record.capture_bbox === "string" && (
                        <CaptureDisplay
                          capture={record.capture_bbox}
                          title="Detecção de Pessoas"
                        />
                      )}

                    {!record.capture && !record.capture_bbox && (
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl h-40 flex items-center justify-center">
                        <div className="text-center">
                          <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Nenhuma captura disponível
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "insights" && (
            <div className="space-y-6">
              <div className="text-center py-12">
                {/* <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Insights Avançados
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Os insights gerados por IA aparecerão aqui após a análise do
                  conteúdo e dados de audiência.
                </p> */}

                {/* <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800 max-w-2xl mx-auto">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                      <Brain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Execute análises para gerar insights
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Utilize os botões Rodar Computação Visual e Gerar Insights
                    com LLM na aba Visão Geral para obter análises detalhadas
                    sobre:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Engajamento da audiência</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Análise demográfica</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Efetividade do conteúdo</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Horários ideais</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Recomendações</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>Métricas de performance</span>
                      </div>
                    </div>
                  </div>
                </div> */}
                {record?._id && (
                  <DisplayLogLLMStreamComponent record={record} />
                )}
                {/* Placeholder for future insights */}
                {/* <div className="mt-8 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Área reservada para exibição de insights gerados por IA
                    </p>
                    <p className="text-xs mt-2 opacity-75">
                      readme.md: Esta seção será expandida quando o objeto
                      insights for implementado
                    </p>
                  </div>
                </div> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
