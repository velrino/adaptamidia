import { IApiRequest, IApiRequestMethod } from "./api.interface";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";

export const ApiResources = {
  async request(parameters: IApiRequest): Promise<Response> {
    let url = `${process.env.NEXT_PUBLIC_BASE_API_URL?.concat(
      parameters.path
    )}`;
    const headers = new Headers(parameters.headers);

    // Only set Content-Type if not FormData
    if (
      !headers.has("Content-Type") &&
      !(parameters.data instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (parameters.access_token) {
      headers.set("Authorization", `Bearer ${parameters.access_token}`);
    }

    const options: RequestInit = {
      method: parameters.method,
      headers,
    };

    if (parameters.method === IApiRequestMethod.GET && parameters.data) {
      const queryString = stringifyParams(parameters.data);
      url = `${url}?${queryString}`;
    } else if (parameters.data) {
      // Don't stringify if it's FormData
      options.body =
        parameters.data instanceof FormData
          ? parameters.data
          : JSON.stringify(parameters.data);
    }

    const result = await fetch(url, options);

    if (result.status === 401) {
      toast.error("Sessão expirada. Você será redirecionado para o login.", {
        toastId: "session-expired",
      });
      localStorage.clear();
      await signOut({ redirect: false });
      window.location.href = "/login";
    }

    return result;
  },
};

const stringifyParams = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((val, index) => {
        searchParams.append(`${key}[${index}]`, val);
      });
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};
