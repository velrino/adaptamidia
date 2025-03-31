"use client";

import Spinner from "@/components/ui/spinner/Spinner";
import { createContext, useContext, useState } from "react";

interface LoadingContextType {
  isFullScreenLoading: boolean;
  showFullScreenLoading: () => void;
  hideFullScreenLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isFullScreenLoading: false,
  showFullScreenLoading: () => {},
  hideFullScreenLoading: () => {},
});

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isFullScreenLoading, setIsLoading] = useState(false);

  const showFullScreenLoading = () => setIsLoading(true);
  const hideFullScreenLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider
      value={{
        isFullScreenLoading,
        showFullScreenLoading,
        hideFullScreenLoading,
      }}
    >
      {children}

      {/* LoadingOverlay integrado diretamente no Provider */}
      {isFullScreenLoading && (
        <div className="fixed inset-0 z-[99999999999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-25"></div>
          <div className="relative z-10">
            <Spinner color="#465fff" />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
