export enum LanguageEnum {
  PT_BR = 'PT_BR',
  EN = 'EN',
  ES = 'ES',
}

export enum NewsProviderEnum {
  NEWS_API = 'NEWS_API',
  LESAMPA = 'LESAMPA',
}

export enum NewsStatusEnum {
  ACTIVE = 'ACTIVE',
  REVIEW = 'REVIEW',
  INACTIVE = 'INACTIVE',
}

export enum NewsKeywordEnum {
  SAUDE = 'SAÚDE',
  BRASIL = 'BRASIL',
  MUNDO = 'MUNDO',
  ECONOMIA = 'ECONOMIA',
  TECNOLOGIA = 'TECNOLOGIA',
  BITCOIN = 'BITCOIN',
  CINEMA = 'CINEMA',
  NEGOCIOS = 'NEGÓCIOS',
  MUSICA = 'MÚSICA',
  EDUCACAO = 'EDUCAÇÃO',
  ESPORTES = 'ESPORTES',
  CIENCIA = 'CIÊNCIA',
  INOVACAO = 'INOVAÇÃO',
  MEIO_AMBIENTE = 'MEIO AMBIENTE',
  INTELIGENCIA_ARTIFICIAL = 'INTELIGÊNCIA ARTIFICIAL',
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
