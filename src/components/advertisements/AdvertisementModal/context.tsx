import {
  useState,
  useCallback,
  useMemo,
  useContext,
  createContext,
  useEffect,
} from "react";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";

interface IAdvertisementContext {
  data: IApiAdvertisementItem; // data sempre será IApiAdvertisementItem
  onCallback: (result: IApiAdvertisementItem) => void;
}

// Criando o contexto com um valor padrão
export const AdvertisementContext = createContext<IAdvertisementContext>({
  data: {} as IApiAdvertisementItem, // Valor padrão vazio (ou você pode definir um objeto padrão)
  onCallback: () => {},
});

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
  initialData: IApiAdvertisementItem; // initialData agora é obrigatório
}

export const AdvertisementProvider = ({
  children,
  initialData, // initialData sempre existe
}: AdvertisementProviderProps) => {
  const [originalRecord, setOriginalRecord] =
    useState<IApiAdvertisementItem>(initialData);

  // Atualiza o estado quando initialData mudar
  useEffect(() => {
    setOriginalRecord(initialData);
  }, [initialData]);

  // Memoriza originalRecord para evitar re-renderizações desnecessárias
  const memoizedOriginalRecord = useMemo(
    () => originalRecord,
    [originalRecord]
  );

  // Callback otimizado para atualizar o estado apenas quando necessário
  const callback = useCallback((result: IApiAdvertisementItem) => {
    // console.log("Callback chamado com:", result);

    setOriginalRecord((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(result)) {
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
