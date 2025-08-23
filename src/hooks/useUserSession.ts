import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { API } from "@/backend/api/api.endpoints";
import { GetErrorMessage, StorageKey } from "@/utils/generic";
import { IToastType } from "@/interfaces/general";
import { useCache } from "./useCache";

interface UseUserSessionOptions {
  cacheDuration?: number; // milliseconds, default 5 minutes
  cacheKey?: string;
}

export function useUserSession(options: UseUserSessionOptions = {}) {
  const {
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    cacheKey = StorageKey.USER_DATA_CACHE,
  } = options;

  const { data: session } = useSession();
  const { showToast } = useToast();
  const { setUserData } = useUser();
  const { getCachedData, setCachedData } = useCache();

  useEffect(() => {
    const checkSession = async () => {
      if (!session?.api_session?.access_token) return;

      const cachedData = getCachedData<any>(cacheKey, cacheDuration);
      if (cachedData) {
        setUserData(cachedData);
        return;
      }

      try {
        const response = await API.user.me(session.api_session.access_token);
        const responseData: any = await response.json();

        if (responseData?.error) {
          showToast(GetErrorMessage(responseData.message), IToastType.ERROR);
        } else if (response.ok) {
          setCachedData(cacheKey, responseData);
          setUserData(responseData);
        }
      } catch (error) {
        showToast("Erro ao carregar dados do usuário", IToastType.ERROR);
      }
    };

    checkSession();
  }, [
    session?.api_session?.access_token,
    showToast,
    setUserData,
    getCachedData,
    setCachedData,
    cacheKey,
    cacheDuration,
  ]);

  return {
    session,
    isLoading: !session,
  };
}
