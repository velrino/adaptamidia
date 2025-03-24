import { IApiRequest, IApiRequestMethod } from "./api.interface";

export const ApiResources = {
  async request(parameters: IApiRequest): Promise<Response> {
    let url = `${process.env.NEXT_PUBLIC_BASE_API_URL?.concat(
      parameters.path
    )}`;

    const headers = new Headers(parameters.headers);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add Authorization header if the request is authenticated
    if (parameters.access_token) {
      headers.set("Authorization", `Bearer ${parameters.access_token}`);
    }

    // Define the request options
    const options: RequestInit = {
      method: parameters.method,
      headers,
    };

    if (parameters.method === IApiRequestMethod.GET && parameters.data) {
      // Converter parâmetros data para query string
      // const queryString = new URLSearchParams(parameters.data).toString();
      const queryString = stringifyParams(parameters.data);
      url = `${url}?${queryString}`;
    } else if (parameters.data) {
      // Se não for GET, adicionar o corpo da requisição
      options.body = JSON.stringify(parameters.data);
    }

    return await fetch(url, options);
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
