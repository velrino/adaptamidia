import React, { useCallback } from "react";
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
import { IApiUnitPopularTimeItem } from "@/backend/api/api.interface";

export const CompanyUnitModalPopularTimes = ({
  data,
  onUpdate,
}: ICompanyUnitModalCommonProps) => {
  const popularTime = data.popular_time;
  const days = Object.values(IDay).flatMap((day) => {
    const times = popularTime?.days?.[day];
    return times?.length ? [{ day, times }] : [];
  });

  const handleInputAverageVisitors = (
    value: string,
    indexDay: IDay,
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

  const updateForm = useCallback(
    (parameters: {
      value: string | number;
      column: keyof IApiUnitPopularTimeItem;
      indexDay: IDay;
      index: number;
    }) => {
      const dayArray = popularTime?.days?.[parameters.indexDay];
      if (!popularTime || !dayArray) return;

      if (parameters.index in dayArray) {
        const currentItem = dayArray[parameters.index];

        // Só atualiza se o valor for diferente
        if (currentItem[parameters.column] !== parameters.value) {
          onUpdate({
            popular_time: {
              _id: popularTime._id,
              company_unit: popularTime.company_unit,
              days: {
                ...popularTime.days,
                [parameters.indexDay]: Object.assign([...dayArray], {
                  [parameters.index]: {
                    ...currentItem,
                    [parameters.column]: parameters.value,
                  },
                }),
              },
            },
          });
        }
      }
    },
    [popularTime, onUpdate]
  );

  if (!days.length) {
    return (
      <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        Nenhum horário de movimento cadastrado para esta unidade.
      </p>
    );
  }

  return (
    <div className="overflow-y-auto min-h-[75vh] max-h-[75vh] px-6">
      <Tabs
        styles={{
          nav: "p-0",
          navMenu: "mx-auto",
        }}
        tabs={days.map(({ day: currentDay, times: currentTimes }) => ({
          id: currentDay,
          label: TranslateDay(currentDay),
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
                  {currentTimes.map(
                    (
                      currentItem: IApiUnitPopularTimeItem,
                      currentItemIndex: number
                    ) => (
                      <TableRow
                        key={`${currentDay}-${currentItem.hour}-${currentItemIndex}`}
                      >
                        <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                          {TranslateDay(currentDay)}
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
                                currentDay,
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
        }))}
      />
    </div>
  );
};
