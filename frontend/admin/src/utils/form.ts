import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Hook genérico para manipular qualquer estrutura de dados
export function useDynamicForm<T>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);

  // Atualiza qualquer valor independente da estrutura (objeto, array, string, etc.)
  const handleChange = (path: string, value: any) => {
    setFormData((prev: T) => {
      const newData = structuredClone(prev); // Copia segura do estado
      const keys = path.split(".");
      let temp: any = newData;

      // Percorre até o último nível
      keys.slice(0, -1).forEach((key) => {
        if (!(key in temp)) temp[key] = {};
        temp = temp[key];
      });

      // Atualiza o valor
      temp[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return { formData, handleChange, setFormData };
}
