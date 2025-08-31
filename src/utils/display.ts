import { IApiDisplayResponseItem } from "@/backend/api/api.interface";

export const cleanHtmlDescription = (htmlString?: string): string => {
  if (!htmlString) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return doc.body.textContent || "";
};

export const getAssetUrl = (item: IApiDisplayResponseItem): string | null => {
  if (item?.news?.image) {
    return item.news.image;
  } else if (item?.ads?.source_landscape) {
    return item.ads.source_landscape;
  }
  return null;
};

export const formatCurrency = (
  value?: number,
  fallbackValue?: number
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
  }).format(value || fallbackValue || 0);
};
