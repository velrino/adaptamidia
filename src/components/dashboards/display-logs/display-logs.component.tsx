/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Eye,
  TrendingUp,
  Filter,
  Sun,
  Moon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { API } from "@/backend/api/api.endpoints";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// Type definitions
interface DisplayLogData {
  date: string;
  displays: number;
  total_people: number;
  total_men: number;
  total_women: number;
  age?: {
    average: number;
  };
}

interface GroupedData {
  date: string;
  displays: number;
  total_people: number;
  total_men: number;
  total_women: number;
  age_sum: number;
  age_count: number;
  age_average: number;
  items: DisplayLogData[];
}

interface AnalyticsDashboardProps {
  local_unit?: string;
  news?: string;
  advertisement?: string;
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  showMetrics?: boolean;
  showTable?: boolean;
  showDarkToggle?: boolean;
  defaultViewType?: "daily" | "monthly";
  className?: string;
  onDataUpdate?: (data: DisplayLogData[]) => void;
}

// Componente principal do Dashboard - INTERCAMBIÁVEL
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  news,
  local_unit,
  advertisement,
  // Props opcionais de customização
  title = "Dashboard de Analytics",
  subtitle = "Análise de displays e demografia de audiência",
  showControls, // Mostrar controles de filtro
  showMetrics, // Mostrar cards de métricas
  showTable, // Mostrar tabela detalhada
  showDarkToggle, // Mostrar toggle dark mode
  defaultViewType, // 'daily' ou 'monthly'
  className, // Classes CSS customizadas
  onDataUpdate, // Callback quando dados são atualizados
}) => {
  const [data, setData] = useState<DisplayLogData[]>([]);
  const [filteredData, setFilteredData] = useState<GroupedData[]>([]);
  const [viewType, setViewType] = useState<"daily" | "monthly">(
    defaultViewType || "daily"
  );
  const [isDark, setIsDark] = useState(false);

  // Detectar qual tipo de dados foi passado
  const getDataSource = () => {
    if (news) return { type: "news", id: news, label: "Notícias" };
    if (local_unit)
      return { type: "local_unit", id: local_unit, label: "Unidade Local" };
    if (advertisement)
      return { type: "advertisement", id: advertisement, label: "Anúncios" };
    return null;
  };

  const dataSource = getDataSource();
  console.log("dataSource:", dataSource);
  console.log("Component props:", { news, local_unit, advertisement });

  // Função para agrupar dados
  const groupData = (
    rawData: DisplayLogData[],
    type: "daily" | "monthly"
  ): Record<string, GroupedData> => {
    if (!rawData || rawData.length === 0) return {};

    return rawData.reduce((acc: Record<string, GroupedData>, item) => {
      const date = new Date(item.date);
      let key;

      if (type === "monthly") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      } else {
        key = item.date.split("T")[0]; // daily
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          displays: 0,
          total_people: 0,
          total_men: 0,
          total_women: 0,
          age_sum: 0,
          age_count: 0,
          age_average: 0,
          items: [],
        };
      }

      acc[key].displays += item.displays || 0;
      acc[key].total_people += item.total_people || 0;
      acc[key].total_men += item.total_men || 0;
      acc[key].total_women += item.total_women || 0;

      if (item.age && typeof item.age.average === "number") {
        const people = item.total_people || 1;
        acc[key].age_sum += item.age.average * people;
        acc[key].age_count += people;
      }

      acc[key].items.push(item);

      // Calculate age_average for the current group
      acc[key].age_average =
        acc[key].age_count > 0 ? acc[key].age_sum / acc[key].age_count : 0;

      return acc;
    }, {});
  };

  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(true);

  // Carregar dados
  const loadData = async () => {
    if (!session?.api_session) {
      return;
    }

    if (!dataSource) {
      console.error(
        "Nenhuma fonte de dados foi fornecida. Use news, local_unit ou advertisement."
      );
      return;
    }

    try {
      setLoading(true);
      const bodyData: Record<string, any> = {
        from: "CACHE",
        page: 1,
        limit: 366,
        sort: "asc",
      };

      // Adicionar o campo correto baseado na fonte de dados
      bodyData[dataSource.type] = dataSource.id;

      const response = await API.display_logs.dashboard(
        session.api_session.access_token,
        bodyData
      );

      if (response.ok) {
        const responseData = await response.json();
        const dataArray = responseData.data || [];
        console.log({ dataArray });

        setData(dataArray);

        // Callback para componente pai
        if (onDataUpdate) {
          onDataUpdate(dataArray);
        }
      } else {
        console.error(
          "Erro na resposta da API:",
          response.status,
          response.statusText
        );
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados baseado no tipo de visualização
  useEffect(() => {
    const grouped = groupData(data, viewType);
    const groupedArray: GroupedData[] = Object.values(grouped);

    setFilteredData(
      groupedArray.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    );
  }, [data, viewType]);

  useEffect(() => {
    loadData();
  }, [session?.api_session]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  // Configurações dos gráficos
  const displayChartOptions = {
    chart: {
      id: "displays-chart",
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    xaxis: {
      categories: filteredData.map((item) => {
        const date = new Date(item.date);
        return viewType === "monthly"
          ? date.toLocaleDateString("pt-BR", {
              month: "short",
              year: "numeric",
            })
          : date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            });
      }),
      title: { text: viewType === "monthly" ? "Mês" : "Data" },
    },
    yaxis: {
      title: { text: "Número de Displays" },
    },
    title: {
      text: "Displays ao Longo do Tempo",
      align: "left" as const,
    },
    colors: ["#3B82F6"],
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    markers: {
      size: 5,
      hover: { size: 7 },
    },
    grid: {},
    legend: {},
  };

  const displayChartSeries = [
    {
      name: "Displays",
      data: filteredData.map((item) => item.displays || 0),
    },
  ];

  const demographicsChartOptions = {
    chart: {
      id: "demographics-chart",
      toolbar: { show: true },
    },
    xaxis: {
      categories: filteredData.map((item) => {
        const date = new Date(item.date);
        return viewType === "monthly"
          ? date.toLocaleDateString("pt-BR", {
              month: "short",
              year: "numeric",
            })
          : date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            });
      }),
    },
    yaxis: {
      title: { text: "Número de Pessoas" },
    },
    title: {
      text: "Demografia por Gênero",
      align: "left" as const,
    },
    colors: ["#10B981", "#F59E0B"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "top" as const,
    },
    grid: {},
  };

  const demographicsChartSeries = [
    {
      name: "Homens",
      data: filteredData.map((item) => item.total_men || 0),
    },
    {
      name: "Mulheres",
      data: filteredData.map((item) => item.total_women || 0),
    },
  ];

  const ageChartOptions = {
    chart: {
      id: "age-chart",
      toolbar: { show: true },
    },
    xaxis: {
      categories: filteredData.map((item) => {
        const date = new Date(item.date);
        return viewType === "monthly"
          ? date.toLocaleDateString("pt-BR", {
              month: "short",
              year: "numeric",
            })
          : date.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            });
      }),
    },
    yaxis: {
      title: { text: "Idade Média" },
    },
    title: {
      text: "Idade Média ao Longo do Tempo",
      align: "left" as const,
    },
    colors: ["#8B5CF6"],
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.9,
      },
    },
    grid: {},
    legend: {},
  };

  const ageChartSeries = [
    {
      name: "Idade Média",
      data: filteredData.map(
        (item) => Math.round((item.age_average || 0) * 10) / 10
      ),
    },
  ];

  // Métricas resumidas
  const totalDisplays = filteredData.reduce(
    (sum, item) => sum + (item.displays || 0),
    0
  );
  const totalPeople = filteredData.reduce(
    (sum, item) => sum + (item.total_people || 0),
    0
  );
  const averageAge =
    filteredData.length > 0
      ? filteredData.reduce((sum, item) => sum + (item.age_average || 0), 0) /
        filteredData.length
      : 0;

  const themeClasses = {
    // bg: isDark ? "bg-gray-900" : "bg-gray-50",
    cardBg: isDark ? "bg-gray-800" : "bg-white",
    textPrimary: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    border: isDark ? "border-gray-700" : "border-gray-300",
    hoverBg: isDark ? "hover:bg-gray-700" : "hover:bg-gray-50",
    tableBg: isDark ? "bg-gray-700" : "bg-gray-50",
    tableRow: isDark ? "divide-gray-700" : "divide-gray-200",
    input: isDark
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-white border-gray-300 text-gray-900",
    button: isDark
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1
              className={`text-3xl font-bold ${themeClasses.textPrimary} mb-2`}
            >
              {title}
            </h1>
            <p className={themeClasses.textSecondary}>{subtitle}</p>
          </div>

          {/* Dark Mode Toggle */}
          {showDarkToggle && (
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${themeClasses.cardBg} ${themeClasses.border} border ${themeClasses.hoverBg} transition-colors duration-200`}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className={`w-5 h-5 ${themeClasses.textPrimary}`} />
              ) : (
                <Moon className={`w-5 h-5 ${themeClasses.textPrimary}`} />
              )}
            </button>
          )}
        </div>

        {/* Controles */}
        {showControls && (
          <div
            className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6 mb-6`}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className={`w-5 h-5 ${themeClasses.textMuted}`} />
                <label
                  className={`text-sm font-medium ${themeClasses.textSecondary}`}
                >
                  Visualização:
                </label>
                <select
                  value={viewType}
                  onChange={(e) =>
                    setViewType(e.target.value as "daily" | "monthly")
                  }
                  className={`px-3 py-2 ${themeClasses.input} ${themeClasses.border} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="daily">Diário</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              <button
                onClick={loadData}
                disabled={loading}
                className={`px-4 py-2 ${themeClasses.button} text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200`}
              >
                <TrendingUp className="w-4 h-4" />
                {loading ? "Carregando..." : "Atualizar"}
              </button>
            </div>
          </div>
        )}

        {/* Métricas */}
        {showMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-medium ${themeClasses.textSecondary}`}
                  >
                    Total de Displays
                  </p>
                  <p
                    className={`text-2xl font-bold ${themeClasses.textPrimary}`}
                  >
                    {totalDisplays.toLocaleString()}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-medium ${themeClasses.textSecondary}`}
                  >
                    Total de Pessoas
                  </p>
                  <p
                    className={`text-2xl font-bold ${themeClasses.textPrimary}`}
                  >
                    {totalPeople.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-medium ${themeClasses.textSecondary}`}
                  >
                    Idade Média
                  </p>
                  <p
                    className={`text-2xl font-bold ${themeClasses.textPrimary}`}
                  >
                    {Math.round(averageAge * 10) / 10} anos
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Carregando dados...</span>
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="text-center py-12">
            <p className={`text-lg ${themeClasses.textSecondary}`}>
              Nenhum dado encontrado para exibir.
            </p>
            <p className={`text-sm ${themeClasses.textMuted} mt-2`}>
              Verifique se os parâmetros estão corretos.
            </p>
          </div>
        )}

        {/* Gráficos */}
        {!loading && filteredData.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <div className="w-full">
                <div
                  className="chart-container"
                  style={{ position: "relative" }}
                  id="display-chart-container"
                >
                  {typeof window !== "undefined" &&
                    displayChartSeries.length > 0 && (
                      <ReactApexChart
                        key={`display-chart-${
                          filteredData.length
                        }-${isDark}-${Date.now()}`}
                        options={{
                          ...displayChartOptions,
                          chart: {
                            ...displayChartOptions.chart,
                            id: `displays-chart-unique-${Date.now()}-${Math.random()}`,
                            animations: {
                              enabled: false,
                            },
                          },
                          theme: {
                            mode: isDark ? "dark" : "light",
                          },
                          grid: {
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            ...displayChartOptions.grid,
                          },
                          xaxis: {
                            ...displayChartOptions.xaxis,
                            labels: {
                              style: {
                                colors: isDark ? "#9ca3af" : "#6b7280",
                              },
                            },
                          },
                          yaxis: {
                            ...displayChartOptions.yaxis,
                            labels: {
                              style: {
                                colors: isDark ? "#9ca3af" : "#6b7280",
                              },
                            },
                          },
                          legend: {
                            ...displayChartOptions.legend,
                            labels: {
                              colors: isDark ? "#9ca3af" : "#6b7280",
                            },
                          },
                          title: {
                            ...displayChartOptions.title,
                            style: {
                              color: isDark ? "#f9fafb" : "#111827",
                              fontSize: "16px",
                              fontWeight: "600",
                            },
                          },
                        }}
                        series={displayChartSeries}
                        type="line"
                        height={300}
                      />
                    )}
                </div>
              </div>
            </div>

            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <div className="w-full">
                <div
                  className="chart-container"
                  style={{ position: "relative" }}
                  id="demographics-chart-container"
                >
                  {typeof window !== "undefined" &&
                    demographicsChartSeries.length > 0 && (
                      <ReactApexChart
                        key={`demographics-chart-${
                          filteredData.length
                        }-${isDark}-${Date.now()}`}
                        options={{
                          ...demographicsChartOptions,
                          chart: {
                            ...demographicsChartOptions.chart,
                            id: `demographics-chart-unique-${Date.now()}-${Math.random()}`,
                            animations: {
                              enabled: false,
                            },
                          },
                          theme: {
                            mode: isDark ? "dark" : "light",
                          },
                          grid: {
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            ...demographicsChartOptions.grid,
                          },
                          xaxis: {
                            ...demographicsChartOptions.xaxis,
                            labels: {
                              style: {
                                colors: isDark ? "#9ca3af" : "#6b7280",
                              },
                            },
                          },
                          yaxis: {
                            ...demographicsChartOptions.yaxis,
                            labels: {
                              style: {
                                colors: isDark ? "#9ca3af" : "#6b7280",
                              },
                            },
                          },
                          legend: {
                            ...demographicsChartOptions.legend,
                            labels: {
                              colors: isDark ? "#9ca3af" : "#6b7280",
                            },
                          },
                          title: {
                            ...demographicsChartOptions.title,
                            style: {
                              color: isDark ? "#f9fafb" : "#111827",
                              fontSize: "16px",
                              fontWeight: "600",
                            },
                          },
                        }}
                        series={demographicsChartSeries}
                        type="bar"
                        height={300}
                      />
                    )}
                </div>
              </div>
            </div>

            <div
              className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6 xl:col-span-2`}
            >
              <div className="w-full">
                <div
                  className="chart-container"
                  style={{ position: "relative" }}
                  id="age-chart-container"
                >
                  {typeof window !== "undefined" &&
                    ageChartSeries.length > 0 && (
                      <ReactApexChart
                        key={`age-chart-${
                          filteredData.length
                        }-${isDark}-${Date.now()}`}
                        options={{
                          ...ageChartOptions,
                          chart: {
                            ...ageChartOptions.chart,
                            id: `age-chart-unique-${Date.now()}-${Math.random()}`,
                            animations: {
                              enabled: false,
                            },
                          },
                          theme: {
                            mode: isDark ? "dark" : "light",
                          },
                          grid: {
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                            ...ageChartOptions.grid,
                          },
                          xaxis: {
                            ...ageChartOptions.xaxis,
                            labels: {
                              style: {
                                colors: isDark ? "#9ca3af" : "#6b7280",
                              },
                            },
                          },
                          yaxis: {
                            ...ageChartOptions.yaxis,
                            labels: {
                              style: {
                                colors: isDark ? "#9ca3af" : "#6b7280",
                              },
                            },
                          },
                          legend: {
                            ...ageChartOptions.legend,
                            labels: {
                              colors: isDark ? "#9ca3af" : "#6b7280",
                            },
                          },
                          title: {
                            ...ageChartOptions.title,
                            style: {
                              color: isDark ? "#f9fafb" : "#111827",
                              fontSize: "16px",
                              fontWeight: "600",
                            },
                          },
                        }}
                        series={ageChartSeries}
                        type="area"
                        height={300}
                      />
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de dados */}
        {showTable && filteredData.length > 0 && (
          <div
            className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6 mt-6`}
          >
            <h3
              className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}
            >
              Dados Detalhados
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={themeClasses.tableBg}>
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textMuted} uppercase tracking-wider`}
                    >
                      {viewType === "monthly" ? "Mês" : "Data"}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textMuted} uppercase tracking-wider`}
                    >
                      Displays
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textMuted} uppercase tracking-wider`}
                    >
                      Pessoas
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textMuted} uppercase tracking-wider`}
                    >
                      Homens
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textMuted} uppercase tracking-wider`}
                    >
                      Mulheres
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textMuted} uppercase tracking-wider`}
                    >
                      Idade Média
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${themeClasses.cardBg} divide-y ${themeClasses.tableRow}`}
                >
                  {filteredData.map((item, index) => (
                    <tr key={index} className={themeClasses.hoverBg}>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textPrimary}`}
                      >
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textPrimary}`}
                      >
                        {item.displays.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textPrimary}`}
                      >
                        {item.total_people.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textPrimary}`}
                      >
                        {item.total_men.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textPrimary}`}
                      >
                        {item.total_women.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textPrimary}`}
                      >
                        {Math.round(item.age_average * 10) / 10} anos
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
