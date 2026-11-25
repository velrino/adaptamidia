export enum NewsSortKey {
  keyword = "keyword",
  source_name = "source_name",
  author = "author",
  title = "title",
  description = "description",
  image = "image",
  published_at = "published_at",
  url = "url",
  source_id = "source_id",
  provider = "provider",
  created_at = "created_at",
  updated_at = "updated_at",
}

export enum LanguageEnum {
  PT_BR = "PT_BR",
  EN = "EN",
  ES = "ES",
}

export const LanguageAsOptions = [
  { value: LanguageEnum.PT_BR, label: "Português (Brasil)" },
  { value: LanguageEnum.EN, label: "English" },
  { value: LanguageEnum.ES, label: "Español" },
];

export enum NewsStatusEnum {
  ACTIVE = "ACTIVE",
  REVIEW = "REVIEW",
  INACTIVE = "INACTIVE",
}

export const NewsStatusAsOptions = [
  { value: NewsStatusEnum.ACTIVE, label: "Ativo" },
  { value: NewsStatusEnum.REVIEW, label: "Em revisão" },
  { value: NewsStatusEnum.INACTIVE, label: "Inativo" },
];

export enum NewsKeywordEnum {
  ARTE = "ARTE",
  BITCOIN = "BITCOIN",
  BRASIL = "BRASIL",
  CIENCIA = "CIÊNCIA",
  CINEMA = "CINEMA",
  CLIMA = "CLIMA",
  CRIPTO = "CRIPTO",
  CULTURA = "CULTURA",
  ECONOMIA = "ECONOMIA",
  EDUCACAO = "EDUCAÇÃO",
  ESPORTES = "ESPORTES",
  INOVACAO = "INOVAÇÃO",
  INTELIGENCIA_ARTIFICIAL = "INTELIGÊNCIA ARTIFICIAL",
  INTERNET = "INTERNET",
  MEIO_AMBIENTE = "MEIO AMBIENTE",
  MUNDO = "MUNDO",
  MUSICA = "MÚSICA",
  NEGOCIOS = "NEGÓCIOS",
  POLITICA = "POLÍTICA",
  SAUDE = "SAÚDE",
  TECNOLOGIA = "TECNOLOGIA",
}

export const NewsKeywordAsOptions = Object.values(NewsKeywordEnum)
  .sort((a, b) => a.localeCompare(b))
  .map((value) => ({
    value,
    label: value,
  }));

export enum NewsProviderEnum {
  LESAMPA = "LESAMPA",
  NEWS_API = "NEWS_API",
}

export const NewsProviderOptions = Object.values(NewsProviderEnum)
  .sort((a, b) => a.localeCompare(b))
  .map((value) => ({
    value,
    label: value,
  }));
