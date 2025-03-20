import React, { useEffect, useMemo, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { IReactSelectOption, SortOrder } from "@/interfaces/general";

import { ICompanyUnitModalCommonProps } from "../interface";
import { AdPeriodOptions } from "@/interfaces/ads";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompanyUnitPriceSortKey } from "@/interfaces/company-unit";
import { AngleDownIcon, AngleUpIcon, TrashBinIcon } from "@/icons";
import { GenerateNumberRangeAsOptions } from "@/utils/generic";
import Select from "@/components/form/Select";
import { IApiUnitPriceItemResponse } from "@/backend/api/api.interface";

export const CompanyUnitModalPricesTable = ({
  // action,
  data,
  onUpdate,
}: // formReport,
// setFormReport,
ICompanyUnitModalCommonProps) => {
  // const updateForm = (column: keyof IApiUnitItemResponse, value: unknown) => {
  //   onUpdate({ [column]: value });
  // };

  const [adPeriodOptions, setAdPeriodOptions] =
    useState<IReactSelectOption[]>(AdPeriodOptions);

  useEffect(() => {
    setAdPeriodOptions(AdPeriodOptions);
  }, []);

  // const [list, setList] = useState<IApiUnitPriceItemResponse[]>([]);
  const [sortKey, setSortKey] = useState<CompanyUnitPriceSortKey>(
    CompanyUnitPriceSortKey.period
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAndSortedData = useMemo(() => {
    return data.prices
      .filter((item) =>
        Object.values(item).some((value) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === "number") {
            return value.toString().includes(searchTerm);
          }
          return false;
        })
      )
      .sort((a, b) => {
        if (!a[sortKey] || !b[sortKey]) return 0;

        if (sortKey === CompanyUnitPriceSortKey.period) {
          return sortOrder === SortOrder.ASC
            ? a.period.localeCompare(b.period)
            : b.period.localeCompare(a.period);
        }

        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortOrder === SortOrder.ASC
            ? aValue - bValue
            : bValue - aValue;
        }

        return sortOrder === SortOrder.ASC
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
  }, [data.prices, sortKey, sortOrder, searchTerm]);

  const handleSort = (key: CompanyUnitPriceSortKey) => {
    if (sortKey === key) {
      setSortOrder(
        sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
      );
    } else {
      setSortKey(key);
      setSortOrder(SortOrder.ASC);
    }
  };

  const updateForm = (
    column: keyof IApiUnitPriceItemResponse,
    newValue: string | number,
    index: number
  ) => {
    const tempPrices = [...data.prices];
    tempPrices[index] = {
      ...tempPrices[index],
      [column]: newValue,
    };

    onUpdate({ prices: tempPrices });
  };

  const handlePriceInput = (value: string, index: number) => {
    const cleanValue = Number(value.replace(/\D/g, ""));

    updateForm("price_total", isNaN(cleanValue) ? 0 : cleanValue, index);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value / 100); // Divide por 100 para representar centavos corretamente
  };

  const secondsOptions = GenerateNumberRangeAsOptions(20, 40);

  return (
    <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
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

      <Table>
        <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            {[
              { key: CompanyUnitPriceSortKey.period, label: "Periodo" },
              { key: CompanyUnitPriceSortKey.price_total, label: "Preço" },
              { key: CompanyUnitPriceSortKey.seconds, label: "Segundos" },
              {
                key: CompanyUnitPriceSortKey.display_times,
                label: "Exibições",
              },
              {
                key: CompanyUnitPriceSortKey.average_visitors,
                label: "Média de visitantes",
              },
            ].map(({ key, label }) => (
              <TableCell
                key={key}
                isHeader
                className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleSort(key as CompanyUnitPriceSortKey)}
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
            <TableCell
              isHeader
              className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center"
            >
              <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                Ação
              </p>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...filteredAndSortedData].map((item, i) => (
            <TableRow key={`${item.period}-${i}`}>
              <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                <Select
                  options={adPeriodOptions}
                  defaultValue={item.period}
                  placeholder="Período"
                  onChange={(value: string) => {
                    updateForm("period", Number(value), i);
                  }}
                  className="dark:bg-dark-900"
                />
              </TableCell>
              <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                <Input
                  type="text"
                  placeholder="Informe o preço"
                  id="price_total"
                  value={formatCurrency(item.price_total)}
                  onChange={(e) => handlePriceInput(e.target.value, i)}
                  maxLength={18}
                />
              </TableCell>
              <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                <Select
                  options={secondsOptions}
                  defaultValue={String(item.seconds)}
                  placeholder="Segundos"
                  onChange={(value: string) => {
                    updateForm("seconds", Number(value), i);
                  }}
                  className="dark:bg-dark-900"
                />
              </TableCell>
              <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                {item.average_visitors}
              </TableCell>
              <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                {item.display_times}
              </TableCell>
              <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                <div className="flex items-center w-full gap-2 justify-center">
                  <button className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500">
                    <TrashBinIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
