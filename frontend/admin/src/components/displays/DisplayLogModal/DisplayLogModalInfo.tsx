/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState } from "react";
import {
  MapPin,
  Clock,
  Users,
  Activity,
  FileText,
  Target,
  Globe,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { IApiDisplayLogItem } from "@/backend/api/api.interface";
import { DateHelper } from "@/utils/date";
import { DisplayLogLLMStreamComponent } from "./LLM";

interface DisplayLogModalInfoProps {
  recordInformed: IApiDisplayLogItem;
}

type TabType = "overview" | "analytics" | "content" | "insights";

export default function DisplayLogModalInfo({
  recordInformed,
}: DisplayLogModalInfoProps) {
  const [record] = useState<IApiDisplayLogItem>(recordInformed);

  const [activeTab, setActiveTab] = useState<TabType>("content");
  const deviceId = (record as any)?.device as string | undefined;
  const [mediaMode, setMediaMode] = useState<"portrait" | "landscape">(
    record.orientation?.toLowerCase() === "portrait" ? "portrait" : "landscape"
  );
  const videoAspectClass = useMemo(() => {
    return mediaMode === "portrait" ? "aspect-[9/16]" : "aspect-video";
  }, [mediaMode]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const mm = String(mins).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");
    if (hrs > 0) return `${String(hrs).padStart(2, "0")}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  };

  const getStatusColor = (status: string) => {
    return status === "DETECTION_INSIGHTFACE"
      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400"
      : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-800 dark:to-slate-800 dark:text-gray-300";
  };

  const isAdvertisement =
    record.type === "ADVERTISEMENT" && record.advertisement;
  const isNews = record.type === "NEWS" && record.news;

  const tabs = [
    { id: "content", label: "Conteúdo", icon: FileText },
    { id: "overview", label: "Visão Geral", icon: Activity },
    { id: "insights", label: "Insights", icon: Sparkles },
  ];

  return (
    <div className=" py-6 transition-all duration-300">
      {/* Main Container */}
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
          <div className="relative">
            <div className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(75%_75%_at_0%_0%,rgba(79,70,229,0.25)_0%,transparent_60%),radial-gradient(75%_75%_at_100%_0%,rgba(236,72,153,0.25)_0%,transparent_60%)]" />
            <div className="relative bg-gradient-to-r from-slate-900 via-indigo-900 to-fuchsia-900 p-6 text-white">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm shadow">
                    {record.type === "NEWS" ? (
                      <Globe className="w-6 h-6" />
                    ) : (
                      <Target className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                        {record.type === "NEWS" ? "News" : "Advertisement"}
                      </span>
                      <span className="text-xs text-white/70">
                        {record.start_at
                          ? DateHelper.format(record.start_at)
                          : "—"}
                      </span>
                      {record.start_at && (
                        <span className="text-[11px] text-white/60">
                          ({DateHelper.timeAgo(record.start_at)})
                        </span>
                      )}
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                      {record.type === "NEWS"
                        ? record.news?.title || "Log de Exibição"
                        : record.advertisement?.title || "Log de Exibição"}
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${getStatusColor(
                          record.status
                        )} bg-white/10`}
                      >
                        {record.status.replace("DETECTION_", "")}
                      </span>
                      {record.local_unit?.name && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 border border-white/10 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{" "}
                          {record.local_unit.name}
                        </span>
                      )}
                      {record.orientation && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 border border-white/10">
                          {record.orientation}
                        </span>
                      )}
                      {deviceId && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 border border-white/10">
                          Device: {deviceId}
                        </span>
                      )}
                      {record.ip && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 border border-white/10">
                          IP: {record.ip}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-white/60">Identifier</div>
                  <div className="font-mono text-sm truncate max-w-[28ch]">
                    {record.identifier}
                  </div>
                  <div className="mt-1 text-xs text-white/60">ID</div>
                  <div className="font-mono text-xs truncate max-w-[28ch]">
                    {record._id}
                  </div>
                  {record.type === "NEWS" && record.news?.source_name && (
                    <div className="mt-2 inline-flex items-center gap-2 text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      <Globe className="w-3 h-3" /> {record.news.source_name}
                    </div>
                  )}
                  {record.type === "ADVERTISEMENT" && record.advertiser && (
                    <div className="mt-2 inline-flex items-center gap-2 text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      <Target className="w-3 h-3" /> Advertiser:{" "}
                      {record.advertiser}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs as segmented control */}
              <div className="mt-6">
                <div className="inline-flex bg-white/10 border border-white/15 rounded-xl p-1 backdrop-blur">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                          active
                            ? "bg-white text-slate-900 shadow"
                            : "text-white/80 hover:text-white hover:bg-white/5"
                        }`}
                        aria-pressed={active}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
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
                        {record.local_unit?.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {record.local_unit?.full_address}
                      </p>
                    </div>
                    <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                      {record.local_unit?.type}
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
                          {record.start_at
                            ? new Date(record.start_at).toLocaleTimeString(
                                "pt-BR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Início
                        </div>
                      </div>
                      {record.end_at && (
                        <div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {new Date(record.end_at).toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Fim
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Barra de progresso relativa (referência 60s) */}
                    <div>
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 dark:from-green-400 dark:to-emerald-300"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, ((record.seconds || 0) / 60) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        Progresso relativo (ref. 60s)
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
                        {record.yolo?.people ?? record.insightface?.total ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience Analytics (movido para Visão Geral) */}
              <div className="lg:col-span-3">
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Análise de Audiência
                    </h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {record.yolo?.people ?? record.insightface?.total ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Pessoas Detectadas
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {record.insightface?.age?.average ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Média de Idade
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Homens */}
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Homens
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {record.insightface?.men ?? "—"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-blue-100 dark:bg-blue-950/40 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 dark:bg-blue-400"
                          style={{
                            width: `${(() => {
                              const total =
                                record.insightface?.total ||
                                (record.insightface?.men || 0) +
                                  (record.insightface?.women || 0);
                              const men = record.insightface?.men || 0;
                              return total
                                ? Math.min(
                                    100,
                                    Math.max(0, (men / total) * 100)
                                  )
                                : 0;
                            })()}%`,
                          }}
                        />
                      </div>
                    </div>
                    {/* Mulheres */}
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Mulheres
                        </span>
                        <span className="text-pink-600 dark:text-pink-400 font-semibold">
                          {record.insightface?.women ?? "—"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-pink-100 dark:bg-pink-950/40 overflow-hidden">
                        <div
                          className="h-full bg-pink-500 dark:bg-pink-400"
                          style={{
                            width: `${(() => {
                              const total =
                                record.insightface?.total ||
                                (record.insightface?.men || 0) +
                                  (record.insightface?.women || 0);
                              const women = record.insightface?.women || 0;
                              return total
                                ? Math.min(
                                    100,
                                    Math.max(0, (women / total) * 100)
                                  )
                                : 0;
                            })()}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {record.insightface?.age && (
                    <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Faixa Etária
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                          Min: {record.insightface.age.min}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                          Média: {record.insightface.age.average}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                          Máx: {record.insightface.age.max}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Imagens de Captura */}
              {(record.capture || record.capture_bbox) && (
                <div className="lg:col-span-3">
                  <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Capturas de Detecção
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {record.capture && (
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Captura Original
                          </div>
                          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                              src={record.capture}
                              alt="Captura original"
                              className="w-full h-auto"
                            />
                          </div>
                        </div>
                      )}
                      {record.capture_bbox && (
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Captura com Detecções
                          </div>
                          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                              src={record.capture_bbox}
                              alt="Captura com bounding boxes"
                              className="w-full h-auto"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadados básicos */}
              <div className="lg:col-span-3">
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Metadados
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">
                        Dispositivo
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white break-all">
                        {deviceId || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">IP</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {record.ip || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">
                        Criado em
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {record.created_at
                          ? DateHelper.format(record.created_at)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">
                        Atualizado em
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {record.updated_at
                          ? DateHelper.format(record.updated_at)
                          : "—"}
                      </div>
                    </div>
                    <div className="sm:col-span-2 md:col-span-4">
                      <div className="text-gray-500 dark:text-gray-400">
                        User-Agent
                      </div>
                      <div
                        className="font-medium text-gray-900 dark:text-white truncate"
                        title={record.user_agent || undefined}
                      >
                        {record.user_agent || "—"}
                      </div>
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
            <div className="grid lg:grid-cols-5 gap-6">
              <aside className="lg:col-span-2">
                <div className="lg:sticky lg:top-6 space-y-3">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {isAdvertisement ? (
                      <div className={`relative ${videoAspectClass}`}>
                        <video
                          src={
                            (mediaMode === "portrait"
                              ? record.advertisement?.source_portrait ||
                                record.advertisement?.source_landscape
                              : record.advertisement?.source_landscape ||
                                record.advertisement?.source_portrait) ||
                            "/placeholder.mp4"
                          }
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-[4/3]">
                        {record.news?.image ? (
                          <img
                            src={record.news.image}
                            alt="Imagem da notícia"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                            Sem imagem
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isAdvertisement &&
                    (record.advertisement?.source_landscape ||
                      record.advertisement?.source_portrait) && (
                      <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
                        {(["landscape", "portrait"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              setMediaMode(mode);
                            }}
                            className={`px-3 py-1 text-xs rounded-lg ${
                              mediaMode === mode
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </aside>

              <section className="lg:col-span-3 space-y-6">
                {isNews && (
                  <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                      <Globe className="w-4 h-4" />
                      <span className="truncate">
                        {record.news?.source_name}
                      </span>
                      {record.news?.author && (
                        <>
                          <ChevronRight className="w-3 h-3" />
                          <span className="truncate">
                            {record.news?.author}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                      {record.news?.title}
                    </h2>
                    {record.news?.description && (
                      <p className="leading-relaxed text-slate-700 dark:text-slate-200">
                        {record.news.description}
                      </p>
                    )}
                    {record.news?.url && (
                      <a
                        href={record.news.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mt-4 text-sm hover:underline"
                      >
                        Acessar matéria <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </article>
                )}

                {isAdvertisement && (
                  <section className="rounded-2xl border border-purple-200/50 dark:border-purple-800/50 bg-white/60 dark:bg-slate-900/40 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {record.advertisement?.title}
                    </h2>
                    {record.advertisement?.description && (
                      <p className="leading-relaxed text-slate-700 dark:text-slate-200">
                        {record.advertisement.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {record.advertisement?.source_landscape && (
                        <span
                          className={`px-2 py-0.5 rounded-full border ${
                            mediaMode === "landscape"
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          landscape
                        </span>
                      )}
                      {record.advertisement?.source_portrait && (
                        <span
                          className={`px-2 py-0.5 rounded-full border ${
                            mediaMode === "portrait"
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          portrait
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {formatDuration(record.seconds)}
                      </span>
                    </div>
                  </section>
                )}

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                    Metadados
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Dispositivo
                      </div>
                      <div className="font-medium text-slate-900 dark:text-white break-all">
                        {deviceId || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">
                        IP
                      </div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {record.ip || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Criado em
                      </div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {record.created_at
                          ? DateHelper.format(record.created_at)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Atualizado em
                      </div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {record.updated_at
                          ? DateHelper.format(record.updated_at)
                          : "—"}
                      </div>
                    </div>
                    <div className="sm:col-span-2 md:col-span-4">
                      <div className="text-slate-500 dark:text-slate-400">
                        User-Agent
                      </div>
                      <div
                        className="font-medium text-slate-900 dark:text-white truncate"
                        title={record.user_agent || undefined}
                      >
                        {record.user_agent || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {false && <></>}

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
                  <DisplayLogLLMStreamComponent key={record._id} record={record} />
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
