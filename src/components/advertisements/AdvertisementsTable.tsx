"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { AngleDownIcon, AngleUpIcon } from "@/icons";
import Image from "next/image";
import {
  IApiAdvertisementItem,
  IApiAdvertisementResponse,
  IApiPaginateAdvertisement,
} from "@/backend/api/api.interface";
import { AdSortKey, AdType } from "@/interfaces/ads";
import { ContentAction, IToastType, SortOrder } from "@/interfaces/general";
import { AdsRecordDefault } from "@/backend/mock/advertisements";
import { DateHelper } from "@/utils/date";
import AdvertisementModal from "./AdvertisementModal";
import Button from "../ui/button/Button";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { API } from "@/backend/api/api.endpoints";
import { GetErrorMessage } from "@/utils/generic";

export default function AdvertisementsTable() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [currentPage] = useState(1);
  const [contentAction, setContentAction] = useState<ContentAction>(
    ContentAction.CREATE
  );
  const [sortKey, setSortKey] = useState<AdSortKey>(AdSortKey.start_date);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentAdvertisement, setCurrentAdvertisement] =
    useState<IApiAdvertisementItem | null>();
  const [list, setList] = useState<IApiAdvertisementItem[]>([]);
  const [response, setResponse] = useState<IApiAdvertisementResponse>();

  const handleResponse = useCallback(async (): Promise<
    IApiAdvertisementItem[]
  > => {
    return new Promise<IApiAdvertisementItem[]>((resolve) => {
      setTimeout(() => {
        resolve(response?.data || []);
      }, 1);
    });
  }, [response]);

  useEffect(() => {
    if (!response) return;

    handleResponse().then((data) => {
      // setContentAction(() => ContentAction.UPDATE);
      // setCurrentAdvertisement(data[0] || null);
      setList(data);
    });
  }, [response, handleResponse]);

  const openCreate = () => {
    setContentAction(() => ContentAction.CREATE);
    setCurrentAdvertisement(AdsRecordDefault);
  };

  const getResponse = useCallback(
    async (apiQuery: IApiPaginateAdvertisement) => {
      if (!session?.api_session) {
        return;
      }

      try {
        const query: IApiPaginateAdvertisement = {
          page: currentPage,
          limit: 100,
          ...apiQuery,
        };

        const response = await API.advertisement.paginate(
          session.api_session.access_token,
          query
        );

        const data = await response.json();

        if (data?.error) {
          showToast(GetErrorMessage(data.error), IToastType.ERROR);
        } else if (response.ok) {
          setResponse(data);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      }
    },
    [currentPage, session?.api_session, showToast, setResponse]
  );

  useEffect(() => {
    if (session?.api_session) {
      getResponse({});
    }
  }, [getResponse, session?.api_session]);

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
        if (!a[sortKey] || !b[sortKey]) return 0;

        if (sortKey === AdSortKey.title) {
          return sortOrder === SortOrder.ASC
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }

        if (
          sortKey === AdSortKey.start_date ||
          sortKey === AdSortKey.end_date
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

  const handleSort = (key: AdSortKey) => {
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
      <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
        <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
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
                  // getResponse({
                  //   name: searchTerm,
                  //   page: 1,
                  // });
                }
              }}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
          <div>
            <Button size="sm" onClick={openCreate}>
              Criar
            </Button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div>
            <Table>
              <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {[
                    { key: AdSortKey.title, label: "Titulo" },
                    { key: AdSortKey.company, label: "Anunciante" },
                    { key: AdSortKey.type, label: "Estabelecimentos" },
                    { key: AdSortKey.start_date, label: "Data inicial" },
                    { key: AdSortKey.end_date, label: "Data final" },
                    { key: AdSortKey.status, label: "Status" },
                    { key: AdSortKey.seconds, label: "Segundos" },
                  ].map(({ key, label }) => (
                    <TableCell
                      key={key}
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => handleSort(key as AdSortKey)}
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
                      setContentAction(ContentAction.UPDATE);
                      setCurrentAdvertisement(item);
                    }}
                  >
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        {/* Imagem */}
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          {item.type === AdType.IMAGE && (
                            <Image
                              width={100} // Ajustado para manter proporção com o container
                              height={100}
                              src={
                                item?.source_landscape ||
                                item?.source_portrait ||
                                "/placeholder.svg"
                              }
                              alt="title"
                              className="w-full h-full object-cover"
                              style={{ objectPosition: "center" }}
                            />
                          )}
                          {item.type === AdType.VIDEO && (
                            <video
                              // src={`/api/proxy?url=${encodeURIComponent(
                              //   item.items[0]?.source || "/placeholder.svg"
                              // )}`}
                              src={
                                item?.source_landscape ||
                                item?.source_portrait ||
                                "/placeholder.svg"
                              }
                              autoPlay
                              loop
                              muted
                              className="w-full h-full object-cover"
                              style={{ objectPosition: "center" }}
                            />
                          )}
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90 line-clamp-2 break-words max-w-[250px]">
                            {item.title || `Rascunho #${i + 1}`}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm ">
                      {item?.company?.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item?.units?.length || 0}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {DateHelper.format(item?.start_date)}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {DateHelper.format(item?.end_date)}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.status}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.seconds}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {currentAdvertisement && (
        <AdvertisementModal
          action={contentAction}
          data={currentAdvertisement}
          onClose={() => {
            setCurrentAdvertisement(null);
            console.log("Modal closed!");
          }}
          onSuccess={(data) => {
            setCurrentAdvertisement(data);
            setContentAction(ContentAction.UPDATE);
            getResponse({
              cache: false,
            });
          }}
        />
      )}
    </>
  );
}
