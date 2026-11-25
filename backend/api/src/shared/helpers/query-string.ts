export interface IQueryStringPaginationHelper {
  page: number;
  limit: number;
  cache: boolean;
}

export const queryStringCacheHelper = (parameters: any) => {
  parameters.cache = parameters.cache === 'false' ? false : true || true;
  parameters.cache = Boolean(parameters.cache);

  return parameters;
};

export const queryStringPaginationHelper = (
  parameters: Partial<IQueryStringPaginationHelper> = {},
): IQueryStringPaginationHelper => {
  const { page = 1, limit = 100, cache = true } = parameters;

  return {
    ...parameters,
    page,
    limit,
    cache,
  };
};

export const queryStringHelper = (informed: any) => {
  let parameters: IQueryStringPaginationHelper =
    queryStringPaginationHelper(informed);

  if (parameters?.cache) {
    parameters = queryStringCacheHelper(parameters);
  }

  return parameters;
};
