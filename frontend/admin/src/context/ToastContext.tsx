"use client";

import { IToastType } from "@/interfaces/general";
import React, { createContext, useContext, ReactNode } from "react";
import { toast, ToastContainer, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ToastContextType = {
  showToast: (
    message: string,
    type: IToastType,
    options?: ToastOptions
  ) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = (
    message: string,
    type: string = "default",
    options: ToastOptions = {}
  ) => {
    switch (type) {
      case IToastType.SUCCESS:
        toast.success(message, options);
        break;
      case IToastType.ERROR:
        toast.error(message, options);
        break;
      case IToastType.WARNING:
        toast.warn(message, options);
        break;
      case IToastType.INFO:
        toast.info(message, options);
        break;
      default:
        toast(message, options);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastContainer style={{ zIndex: 9999999999999 }} />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};
