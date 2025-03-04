export enum LanguageEnum {
  PT_BR = 'PT_BR',
}

export enum NewsProviderEnum {
  NEWS_API = 'NEWS_API',
}

export enum NewsKeywordEnum {
  SAUDE = 'SAÚDE',
  BRASIL = 'BRASIL',
  MUNDO = 'MUNDO',
  ECONOMIA = 'ECONOMIA',
  TECNOLOGIA = 'TECNOLOGIA',
  BITCOIN = 'BITCOIN',
  CINEMA = 'CINEMA',
}

export interface INewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

export interface INewsApiResponse {
  status: string;
  totalResults: number;
  articles: INewsApiArticle[];
}
