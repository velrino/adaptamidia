import React, { useMemo } from "react";
import Input from "@/components/form/input/InputField";
import { IDay, TranslateDay } from "@/interfaces/general";

import { ICompanyUnitModalCommonProps } from "../interface";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs/Principal";
import {
  IApiUnitPopularTimeData,
  IApiUnitPopularTimeItem,
} from "@/backend/api/api.interface";

export const CompanyUnitModalPopularTimes = ({
  data,
  onUpdate,
}: ICompanyUnitModalCommonProps) => {
  const memorizedData = useMemo(() => {
    return data.popular_time;
  }, [data.popular_time]);

  const handleInputAverageVisitors = (
    value: string,
    indexDay: number,
    index: number
  ) => {
    const cleanValue = Number(value.replace(/\D/g, ""));

    updateForm({
      column: "count",
      index,
      value: cleanValue,
      indexDay,
    });
  };

  const updateForm = (parameters: {
    value: string | number;
    column: keyof IApiUnitPopularTimeItem;
    indexDay: number;
    index: number;
  }) => {
    const currentId = data.popular_time._id;

    const tempData = data.popular_time.data.map((day) => ({
      ...day,
      data: day.data.map((item) => ({ ...item })),
    }));

    if (
      tempData[parameters.indexDay] &&
      tempData[parameters.indexDay].data[parameters.index]
    ) {
      tempData[parameters.indexDay].data[parameters.index] = {
        ...tempData[parameters.indexDay].data[parameters.index],
        [parameters.column]: parameters.value,
      };

      onUpdate({ popular_time: { data: tempData, _id: currentId } });
    } else {
      console.warn({
        local: "companyUnitModalPopularTimes",
        error: "Índices inválidos ao tentar atualizar os dados",
      });
    }
  };

  return (
    <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
      <Tabs
        defaultTabId={IDay.Monday}
        styles={{
          nav: "p-0",
          navMenu: "mx-auto",
        }}
        tabs={memorizedData.data.map(
          (
            currentPopularDay: IApiUnitPopularTimeData,
            currentPopularDayIndex: number
          ) => ({
            id: currentPopularDay.day,
            label: TranslateDay(currentPopularDay.day),
            content: (
              <>
                <Table>
                  <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      {[
                        {
                          key: "day",
                          label: "Dia",
                        },
                        {
                          key: "hour",
                          label: "Horário",
                        },
                        {
                          key: "average_visitors",
                          label: "Média de visitantes",
                        },
                      ].map(({ key, label }) => (
                        <TableCell
                          key={key}
                          isHeader
                          className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                        >
                          <div className="flex items-center justify-between cursor-pointer">
                            <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                              {label}
                            </p>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPopularDay.data.map(
                      (
                        currentItem: IApiUnitPopularTimeItem,
                        currentItemIndex: number
                      ) => (
                        <TableRow
                          key={`${currentPopularDay.day}-${currentItem.hour}-${currentItemIndex}`}
                        >
                          <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                            {TranslateDay(currentPopularDay.day)}
                          </TableCell>
                          <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                            {currentItem.hour}
                          </TableCell>
                          <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                            <Input
                              type="text"
                              placeholder="Informe a média de visitantes"
                              id="average_visitors"
                              value={currentItem.count}
                              onChange={(e) =>
                                handleInputAverageVisitors(
                                  e.target.value,
                                  currentPopularDayIndex,
                                  currentItemIndex
                                )
                              }
                              maxLength={10}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </>
            ),
          })
        )}
      />
    </div>
  );
};
