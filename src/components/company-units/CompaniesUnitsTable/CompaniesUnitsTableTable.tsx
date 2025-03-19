"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Image from "next/image";
import {
  IApiUnitItemResponse,
  IApiUnitsResponse,
} from "@/backend/api/api.interface";
import { ContentAction, SortOrder } from "@/interfaces/general";
import { DateHelper } from "@/utils/date";
import { AngleDownIcon, AngleUpIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import {
  CompanyUnitRecordDefault,
  CompanyUnitsMock,
} from "@/backend/mock/units";
import { CompanyUnitSortKey } from "@/interfaces/company-unit";
import CompanyUnitModal from "../CompanyUnitModal/CompanyUnitModal";

export default function CompanieUnitsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<CompanyUnitSortKey>(
    CompanyUnitSortKey.created_at
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentAction, setContentAction] = useState<ContentAction>(
    ContentAction.CREATE
  );
  const [currentSelected, setCurrentSelected] =
    useState<IApiUnitItemResponse | null>();
  const [list, setList] = useState<IApiUnitItemResponse[]>([]);
  const [response, setResponse] = useState<IApiUnitsResponse>();

  const handleResponse = useCallback(async (): Promise<
    IApiUnitItemResponse[]
  > => {
    return new Promise<IApiUnitItemResponse[]>((resolve) => {
      setTimeout(() => {
        resolve(response?.data || []);
      }, 1);
    });
  }, [response]);

  useEffect(() => {
    if (!response) return;

    handleResponse().then((data) => {
      setContentAction(() => ContentAction.UPDATE);
      // setCurrentSelected(data[0] || null);
      setList(data);
    });
  }, [response, handleResponse]);

  const getResponse = useCallback(async () => {
    const currentResponse = CompanyUnitsMock;
    setResponse(currentResponse);

    return new Promise<IApiUnitItemResponse[]>((resolve) => {
      setTimeout(() => {
        resolve(currentResponse.data);
      }, 1);
    });
  }, [currentPage]);

  useEffect(() => {
    getResponse();
  }, [getResponse]);

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

        if (sortKey === CompanyUnitSortKey.name) {
          return sortOrder === SortOrder.ASC
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }

        if (
          sortKey === CompanyUnitSortKey.created_at ||
          sortKey === CompanyUnitSortKey.updated_at
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

  const handleSort = (key: CompanyUnitSortKey) => {
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
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
            />
          </div>
          <div>
            <Button
              size="sm"
              onClick={() => {
                setContentAction(() => ContentAction.CREATE);
                setCurrentSelected(CompanyUnitRecordDefault);
              }}
            >
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
                    { key: CompanyUnitSortKey.name, label: "Nome" },
                    { key: CompanyUnitSortKey.full_address, label: "Endereço" },
                    { key: CompanyUnitSortKey.neighborhood, label: "Bairro" },
                    { key: CompanyUnitSortKey.city, label: "Cidade" },
                    { key: CompanyUnitSortKey.state, label: "Estado" },
                    { key: CompanyUnitSortKey.type, label: "Tipo" },
                    { key: CompanyUnitSortKey.status, label: "Status" },
                    { key: CompanyUnitSortKey.created_at, label: "Criado em" },
                    {
                      key: CompanyUnitSortKey.updated_at,
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
                        onClick={() => handleSort(key as CompanyUnitSortKey)}
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
                      setContentAction(() => ContentAction.UPDATE);
                      setCurrentSelected(item);
                    }}
                  >
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {/* Imagem */}
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          <Image
                            width={100} // Ajustado para manter proporção com o container
                            height={100}
                            src={"/images/company/default.webp"}
                            alt="title"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: "center" }}
                          />
                        </div>

                        {/* Texto */}
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {item.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.full_address}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.neighborhood}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.city}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.state}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.type}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {item.status}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {DateHelper.format(item?.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                      {DateHelper.format(item?.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {currentSelected && (
        <CompanyUnitModal
          action={contentAction}
          record={currentSelected}
          onCloseCallback={() => {
            setCurrentSelected(null);
          }}
        />
      )}
    </>
  );
}
