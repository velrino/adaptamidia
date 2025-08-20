"use client";

import {
  IApiGroupCompanyUnitsRequest,
  IApiGroupCompanyUnitsResponseItem,
  IApiPaginateCompanyUnits,
  IApiUnitItemResponse,
} from "@/backend/api/api.interface";
import { useToast } from "@/context/ToastContext";
import { useState, useCallback, useRef, useEffect } from "react";
import { IReactSelectOption, IToastType } from "@/interfaces/general";
import SelectReact from "react-select";
import Label from "@/components/form/Label";
import { useSession } from "next-auth/react";
import { API } from "@/backend/api/api.endpoints";
import { GetErrorMessage } from "@/utils/generic";
import { SumAllDevices } from "@/components/advertisements/AdvertisementModal/helper";
import { useLoading } from "@/context/LoadingContext";
import RegionsUnits, {
  EnumRegionsUnits,
  IRegionsUnitsCallback,
} from "./RegionsUnits";

interface RegionsComponentProps {
  neighborhoodInformed: string[];
  unitsInformed: string[];
  onNeighborhoodChange?: (neighborhoods: string[]) => void;
  onUnitsChange?: (units: IApiUnitItemResponse[]) => void;
}

export function RegionsComponent({
  neighborhoodInformed = [],
  unitsInformed = [],
  onNeighborhoodChange,
  onUnitsChange,
}: RegionsComponentProps) {
  const { data: session } = useSession();

  const { showFullScreenLoading, hideFullScreenLoading } = useLoading();
  const { showToast } = useToast();

  const [unitsOptions, setUnitsOptions] = useState<IReactSelectOption[]>([]);
  const [isUnitsLoading, setIsUnitsLoading] = useState(false);

  const getCompanyGroup = useCallback(
    async (apiQuery: IApiGroupCompanyUnitsRequest) => {
      if (!session?.api_session) {
        return;
      }

      setIsUnitsLoading(true);
      try {
        const query: IApiGroupCompanyUnitsRequest = {
          ...apiQuery,
        };

        const response = await API.company_units.group(
          session.api_session.access_token,
          query
        );

        const responseData = await response.json();

        if (responseData?.error) {
          showToast(GetErrorMessage(responseData.error), IToastType.ERROR);
        } else if (response.ok) {
          const companyUnitList = responseData.data
            .map((item: IApiGroupCompanyUnitsResponseItem) => ({
              value: item.neighborhood,
              label: `${item.city} - ${item.neighborhood}`,
            }))
            .sort((a: IReactSelectOption, b: IReactSelectOption) =>
              a.label.localeCompare(b.label)
            );
          setUnitsOptions(companyUnitList);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        setIsUnitsLoading(false);
      }
    },
    [session?.api_session, showToast]
  );

  useEffect(() => {
    if (session?.api_session) {
      getCompanyGroup({});
    }
  }, [getCompanyGroup, session?.api_session]);

  const [units, setUnits] = useState<IApiUnitItemResponse[]>([]);
  const [showUnits, setShowUnits] = useState<boolean>(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleToggleShowUnits = useCallback(() => {
    setShowUnits((prev) => !prev);
  }, []);

  const regionsUnitsCallback = useCallback(
    (current: IRegionsUnitsCallback) => {
      if (current.type === EnumRegionsUnits.REMOVE_UNIT) {
        const currentData = current.data as IApiUnitItemResponse;
        const newUnits = units.filter((item) => item._id !== currentData._id);
        setUnits(newUnits);

        // Schedule the callback for the next tick to avoid setState during render
        setTimeout(() => onUnitsChange?.(newUnits), 0);
      }
    },
    [units, onUnitsChange]
  );

  const getUnits = useCallback(
    async (apiQuery: IApiPaginateCompanyUnits) => {
      if (!session?.api_session) {
        return;
      }

      setIsUnitsLoading(true);
      showFullScreenLoading();
      try {
        const query: IApiPaginateCompanyUnits = {
          limit: 100,
          ...apiQuery,
        };

        const response = await API.company_units.paginatePost(
          session.api_session.access_token,
          query
        );

        const responseData = await response.json();

        if (responseData?.error) {
          showToast(GetErrorMessage(responseData.error), IToastType.ERROR);
        } else if (response.ok) {
          setUnits((prevUnits) => {
            const existingIds = new Set(
              prevUnits.map((unit: IApiUnitItemResponse) => unit._id)
            );
            const newUnits = responseData.data.filter(
              (unit: IApiUnitItemResponse) => !existingIds.has(unit._id)
            );
            const updatedUnits = [...prevUnits, ...newUnits];

            // Schedule the callback for the next tick to avoid setState during render
            setTimeout(() => onUnitsChange?.(updatedUnits), 0);

            return updatedUnits;
          });
          showToast("Adicionado com sucesso", IToastType.SUCCESS);
        }
      } catch (error) {
        showToast(GetErrorMessage(error), IToastType.ERROR);
      } finally {
        setIsUnitsLoading(false);
        hideFullScreenLoading();
      }
    },
    [
      session?.api_session,
      showToast,
      showFullScreenLoading,
      hideFullScreenLoading,
      onUnitsChange,
    ]
  );

  const lastNeighborhoods = useRef<string[]>(neighborhoodInformed || []);

  useEffect(() => {
    const handleGetUnits = async () => {
      try {
        if (
          unitsInformed.length > 0 &&
          session?.api_session &&
          !hasInitialized
        ) {
          await getUnits({ units: unitsInformed });
        }
      } catch (error) {
        console.error({ RegionsComponent: error });
      } finally {
        setHasInitialized(true);
      }
    };

    handleGetUnits();
  }, [unitsInformed, session?.api_session, getUnits, hasInitialized]);

  useEffect(() => {
    const currentNeighborhoods = neighborhoodInformed || [];
    const currentLength = currentNeighborhoods.length;

    // Só executa se hasInitialized for true (evita execução na inicialização)
    if (!hasInitialized) {
      lastNeighborhoods.current = currentNeighborhoods;
      return;
    }

    // Detecta adição de bairro
    if (currentLength > lastNeighborhoods.current.length) {
      const lastNeighborhood = currentNeighborhoods.slice(-1)[0];
      getUnits({ neighborhood: lastNeighborhood });
    }
    // Detecta remoção de bairro
    else if (currentLength < lastNeighborhoods.current.length) {
      const removedNeighborhood = lastNeighborhoods.current.find(
        (neighborhood) => !currentNeighborhoods.includes(neighborhood)
      );

      if (removedNeighborhood) {
        setUnits((prevUnits) => {
          const filteredUnits = prevUnits.filter(
            (unit) => unit.neighborhood !== removedNeighborhood
          );

          // Schedule the callback for the next tick to avoid setState during render
          setTimeout(() => onUnitsChange?.(filteredUnits), 0);

          return filteredUnits;
        });
      }
    }

    lastNeighborhoods.current = currentNeighborhoods;
  }, [neighborhoodInformed, getUnits, onUnitsChange, hasInitialized]);

  return (
    <>
      <div className="col-span-2">
        <Label htmlFor="title">Regiões</Label>
        <SelectReact
          isMulti
          placeholder="Selecione as regiões"
          isDisabled={isUnitsLoading}
          isLoading={isUnitsLoading}
          className="dark:bg-dark-900"
          value={
            unitsOptions.filter((option: IReactSelectOption) =>
              neighborhoodInformed.includes(option.value as string)
            ) || []
          }
          options={unitsOptions}
          onChange={(newValue) => {
            const neighborhoods = newValue.map(
              (neighborhood) => neighborhood.value
            );
            onNeighborhoodChange?.(neighborhoods);
          }}
        />
      </div>

      <div className="col-span-2">
        <RegionsUnits
          title={`Estabelecimentos (${units.length}) - ${SumAllDevices(
            units
          )} Telas`}
          content={units}
          seconds={0}
          isOpen={showUnits}
          toggleAccordion={handleToggleShowUnits}
          callback={regionsUnitsCallback}
        />
      </div>
    </>
  );
}
