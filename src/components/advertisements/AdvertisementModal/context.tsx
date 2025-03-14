import {
  useState,
  useCallback,
  useMemo,
  useContext,
  createContext,
} from "react";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";

interface IAdvertisementContext {
  data: IApiAdvertisementItem | null;
  onCallback: (result: IApiAdvertisementItem) => void;
}

// Criando o contexto sem `undefined`, mas com `null` como valor inicial
export const AdvertisementContext = createContext<IAdvertisementContext | null>(
  null
);

// Hook para acessar o contexto
export const useAdvertisement = () => {
  const context = useContext(AdvertisementContext);
  if (!context) {
    throw new Error(
      "useAdvertisement deve ser usado dentro de um AdvertisementProvider"
    );
  }
  return context;
};

interface AdvertisementProviderProps {
  children: React.ReactNode;
  initialData: IApiAdvertisementItem | null; // 🔥 Adicionando initialData como prop
}

export const AdvertisementProvider = ({
  children,
  initialData,
}: AdvertisementProviderProps) => {
  const [originalRecord, setOriginalRecord] =
    useState<IApiAdvertisementItem | null>(initialData); // 🔥 Iniciando com initialData

  const memoizedOriginalRecord = useMemo(
    () => originalRecord,
    [originalRecord]
  );

  const callback = useCallback((result: IApiAdvertisementItem) => {
    console.log("CALLBACK");

    setOriginalRecord((prev) => {
      if (!prev || JSON.stringify(prev) !== JSON.stringify(result)) {
        return { ...result };
      }
      return prev;
    });
  }, []);

  return (
    <AdvertisementContext.Provider
      value={{ data: memoizedOriginalRecord, onCallback: callback }}
    >
      {children}
    </AdvertisementContext.Provider>
  );
};
