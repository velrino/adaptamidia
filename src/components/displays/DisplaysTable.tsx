"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import {
  IApiDisplayLogItem,
  IApiDisplayLogResponse,
  IApiPaginateDisplayLogs,
} from "@/backend/api/api.interface";
import { IToastType, SortOrder } from "@/interfaces/general";
import { DateHelper } from "@/utils/date";
import { AngleDownIcon, AngleUpIcon } from "@/icons";
import { DisplayLogSortKey } from "@/interfaces/display-logs";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { cn, GetErrorMessage } from "@/utils/generic";
import { API } from "@/backend/api/api.endpoints";
import PaginationWithIcon from "../ui/pagination/PaginationWitIcon";
import Spinner from "../ui/spinner/Spinner";
import DisplayLogModal from "./DisplayLogModal/DisplayLogModal";

interface IDisplaysTable {
  internalQuery?: IApiPaginateDisplayLogs;
  className?: string;
}

export default function DisplaysTable({
  internalQuery,
  className,
}: IDisplaysTable) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState(1);
  //   const [currentPage] = useState(1);
  // const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<DisplayLogSortKey>(
    DisplayLogSortKey.created_at
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentSelected, setCurrentSelected] =
    useState<IApiDisplayLogItem | null>();
  const [list, setList] = useState<IApiDisplayLogItem[]>([]);
  const [response, setResponse] = useState<IApiDisplayLogResponse>();

  useEffect(() => {
    if (!response) return;

    const map = new Map<string, (typeof response.data)[0]>();

    response.data.forEach((item) => {
      if (!map.has(item._id)) {
        map.set(item._id, {
          ...item,
        });
      }
    });

    const tempList = Array.from(map.values());

    setList(tempList);
  }, [response]);

  const getResponse = useCallback(
    async (apiQuery: IApiPaginateDisplayLogs) => {
      if (!session?.api_session) {
        return;
      }

      try {
        setLoading(true);
        const query: IApiPaginateDisplayLogs = {
          ...internalQuery,
          page: currentPage,
          limit: 20,
          get_signed_url: true,
          sort_by: "created_at",
          sort: SortOrder.DESC,
          ...apiQuery,
        };

        const response = await API.display.paginate(
          session.api_session.access_token,
          query
        );

        const data = await response.json();

        if (data?.error) {
          showToast(GetErrorMessage(data.error), IToastType.ERROR);
        } else if (response.ok) {
          setResponse(data);
          // setCurrentSelected(data?.data?.[0]);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, session?.api_session, showToast, setResponse]
  );

  useEffect(() => {
    if (session?.api_session) {
      getResponse({
        page: currentPage,
      });
    }
  }, [currentPage, getResponse, session?.api_session]);

  const filteredAndSortedData = useMemo(() => {
    return list
      .filter((item) =>
        Object.values(item).some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a, b) => {
        if (sortKey === DisplayLogSortKey.local_unit_name) {
          if (!a.local_unit?.name || !b.local_unit?.name) return 0;
          return sortOrder === SortOrder.ASC
            ? a.local_unit.name.localeCompare(b.local_unit.name)
            : b.local_unit.name.localeCompare(a.local_unit.name);
        }

        if (!a[sortKey] || !b[sortKey]) return 0;

        if (
          sortKey === DisplayLogSortKey.created_at ||
          sortKey === DisplayLogSortKey.updated_at
        ) {
          const dateA = new Date(a[sortKey]).getTime();
          const dateB = new Date(b[sortKey]).getTime();
          return sortOrder === SortOrder.ASC ? dateA - dateB : dateB - dateA;
        }

        return sortOrder === SortOrder.ASC
          ? String(a[sortKey]).localeCompare(String(b[sortKey]))
          : String(b[sortKey]).localeCompare(String(a[sortKey]));
      });
  }, [list, sortKey, sortOrder, searchTerm]);

  // const totalItems = filteredAndSortedData.length;
  // const totalPages = Math.ceil(totalItems / itemsPerPage);

  // const handlePageChange = (page: number) => {
  //   setCurrentPage(page);
  // };

  const handleSort = (key: DisplayLogSortKey) => {
    if (sortKey === key) {
      setSortOrder(
        sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
      );
    } else {
      setSortKey(key);
      setSortOrder(SortOrder.ASC);
    }
  };

  return (
    <>
      <div
        className={cn(
          "overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl mb-20",
          className
        )}
      >
        <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center ">
          <div className="relative">
            <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  fill=""
                />
              </svg>
            </button>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  getResponse({
                    search: searchTerm,
                    page: 1,
                  });
                }
              }}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
          <div className="ml-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Página {currentPage} de {response?.pages || 0} •{" "}
              {response?.total || 0} registros
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div>
            {loading && (
              <div className="text-center my-5">
                <Spinner color="#465fff" size={50} />
              </div>
            )}
            {!loading && (
              <Table>
                <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    {[
                      {
                        key: DisplayLogSortKey.local_unit_name,
                        label: "Local",
                      },
                      { key: DisplayLogSortKey.type, label: "Tipo" },
                      { key: DisplayLogSortKey.status, label: "Status" },
                      { key: DisplayLogSortKey.created_at, label: "Criado em" },
                      {
                        key: DisplayLogSortKey.updated_at,
                        label: "Atualizado em",
                      },
                    ].map(({ key, label }) => (
                      <TableCell
                        key={key}
                        isHeader
                        className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => handleSort(key as DisplayLogSortKey)}
                        >
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                            {label}
                          </p>
                          <button className="flex flex-col gap-0.5">
                            <AngleUpIcon
                              className={`text-gray-300 dark:text-gray-700 ${
                                sortKey === key && sortOrder === "asc"
                                  ? "text-brand-500"
                                  : ""
                              }`}
                            />
                            <AngleDownIcon
                              className={`text-gray-300 dark:text-gray-700 ${
                                sortKey === key && sortOrder === "desc"
                                  ? "text-brand-500"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...filteredAndSortedData].map((item, i) => (
                    <TableRow
                      key={i + 1}
                      className="cursor-pointer"
                      onClick={() => {
                        setCurrentSelected(item);
                      }}
                    >
                      <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Imagem */}
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            {item?.advertisement?.items?.[0]?.source ? (
                              <video
                                width={100}
                                height={100}
                                src={item.advertisement.items[0].source}
                                className="w-full h-full object-cover"
                                style={{ objectPosition: "center" }}
                                muted
                                autoPlay
                                loop
                              />
                            ) : (
                              <Image
                                width={100}
                                height={100}
                                src={
                                  item?.news?.image ||
                                  "/images/company/default.webp"
                                }
                                alt="title"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: "center" }}
                              />
                            )}
                          </div>

                          {/* Texto */}
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.local_unit?.name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                        {item.type}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                        {item.status}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                        <div className="flex flex-col text-theme-sm">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {DateHelper.format(item.created_at)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {DateHelper.timeAgo(item.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                        <div className="flex flex-col text-theme-sm">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {DateHelper.format(item.updated_at)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {DateHelper.timeAgo(item.updated_at)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {(response?.pages ?? 0) > 1 && (
            <div className="max-w-full">
              <div className="flex justify-center">
                <PaginationWithIcon
                  totalPages={response?.pages ?? 1}
                  initialPage={currentPage || 1}
                  onPageChange={(page: number) => {
                    setCurrentPage(page);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {currentSelected && (
        <DisplayLogModal
          record={currentSelected}
          refresh={async (refresh: boolean) => {
            if (refresh) {
              getResponse({
                cache: false,
              });
            }
          }}
          onCloseCallback={(record?: IApiDisplayLogItem | undefined) => {
            if (record?._id) {
              setCurrentSelected(record);
            } else {
              setCurrentSelected(null);
            }
          }}
        />
      )}
    </>
  );
}
