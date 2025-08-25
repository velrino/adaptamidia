/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Users, Eye, Filter, Sun, Moon } from "lucide-react";
import { useSession } from "next-auth/react";
import { API } from "@/backend/api/api.endpoints";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

  // Preparar dados para Recharts
  const chartData = filteredData.map((item) => {
    const date = new Date(item.date);
    const formattedDate =
      viewType === "monthly"
        ? date.toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
          })
        : date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });

    return {
      date: formattedDate,
      displays: item.displays || 0,
      homens: item.total_men || 0,
      mulheres: item.total_women || 0,
      idadeMedia: Math.round((item.age_average || 0) * 10) / 10,
    };
  });

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
    cardBg: "bg-white dark:bg-white/[0.03]",
    textPrimary: "text-gray-900 dark:text-white",
    textSecondary: "text-gray-600 dark:text-gray-300",
    textMuted: "text-gray-500 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-700",
    hoverBg: "hover:bg-gray-50 dark:hover:bg-gray-700",
    tableBg: "bg-gray-50 dark:bg-gray-700",
    tableRow: "divide-gray-200 dark:divide-gray-700",
    input:
      "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
    button:
      "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${className} ${
        isDark ? "dark" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
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
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Gráfico de Displays */}
            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <h3
                className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}
              >
                Displays ao Longo do Tempo
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#374151" : "#ffffff",
                      border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                      borderRadius: "8px",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="displays"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    name="Displays"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Demografia */}
            <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6`}>
              <h3
                className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}
              >
                Demografia por Gênero
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#374151" : "#ffffff",
                      border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                      borderRadius: "8px",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  />
                  <Bar dataKey="homens" fill="#10B981" name="Homens" />
                  <Bar dataKey="mulheres" fill="#F59E0B" name="Mulheres" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Idade Média */}
            <div
              className={`${themeClasses.cardBg} rounded-lg shadow-sm p-6 xl:col-span-2`}
            >
              <h3
                className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}
              >
                Idade Média ao Longo do Tempo
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tick={{
                      fill: isDark ? "#9ca3af" : "#6b7280",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#374151" : "#ffffff",
                      border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                      borderRadius: "8px",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}
                    formatter={(value: any) => [`${value} anos`, "Idade Média"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="idadeMedia"
                    stroke="#8B5CF6"
                    fill="url(#colorIdadeMedia)"
                    strokeWidth={3}
                    name="Idade Média"
                  />
                  <defs>
                    <linearGradient
                      id="colorIdadeMedia"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#8B5CF6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
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
