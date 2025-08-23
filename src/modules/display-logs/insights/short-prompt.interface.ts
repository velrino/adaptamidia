import {
  ApiDetectInsightfaceDefault,
  ApiYoloResultDefault,
} from 'src/shared/detection/detection.interface';
import { IPopulatedDisplayLog } from '../get/get.interface';
import { DisplayType } from 'src/modules/display/unit/unit.interface';

// Pool de objetos reutilizáveis
const stringPool: string[] = [];
const numberPool: number[] = [];

// Cache com TTL e tamanho limitado
const dateCache = new Map<string, string>();
const percentageCache = new Map<string, string>();
let cacheCleanupCounter = 0;
const CACHE_CLEANUP_INTERVAL = 500;
const MAX_CACHE_SIZE = 500;

// Constantes imutáveis (Object.freeze para garantir imutabilidade)
const WEEKDAYS = Object.freeze([
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]);
const PERIODS = Object.freeze(['madrugada', 'manhã', 'tarde', 'noite']);
const LOCATION_MAP = Object.freeze(
  new Map([
    ['RESTAURANT', 'Restaurante'],
    ['BAKERY', 'Padaria'],
    ['STORE', 'Loja'],
    ['MALL', 'Shopping Center'],
    ['CAFE', 'Café'],
  ]),
);

// Strings constantes para evitar recriação
const AD_CONTEXT = 'Ambiente comercial com exposição a público diversificado';
const NEWS_CONTEXT = 'Ambiente propício para consumo de conteúdo';
const DEFAULT_LOCATION = 'Estabelecimento comercial';
const NA_VALUE = 'N/A';

// Buffer reutilizável para construção de strings
let stringBuffer: string[] = [];

// Função inline para limpeza periódica de cache
function cleanupCache(): void {
  if (++cacheCleanupCounter % CACHE_CLEANUP_INTERVAL === 0) {
    if (dateCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(dateCache.entries());
      dateCache.clear();
      // Manter apenas os 50% mais recentes
      const keepCount = Math.floor(MAX_CACHE_SIZE / 2);
      for (let i = entries.length - keepCount; i < entries.length; i++) {
        dateCache.set(entries[i][0], entries[i][1]);
      }
    }
    if (percentageCache.size > MAX_CACHE_SIZE) {
      percentageCache.clear();
    }
  }
}

// Formatação de data ultra-otimizada
function fastDateFormat(date: Date): string {
  const timestamp = date.getTime();
  const key = timestamp.toString();

  let cached = dateCache.get(key);
  if (cached) return cached;

  // Extrair componentes uma única vez
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const weekdayIndex = date.getDay();

  // Construir string diretamente sem padding desnecessário
  stringBuffer.length = 0; // Reset buffer
  stringBuffer.push(
    WEEKDAYS[weekdayIndex],
    ', ',
    day < 10 ? '0' : '',
    day.toString(),
    '/',
    month < 10 ? '0' : '',
    month.toString(),
    '/',
    year.toString(),
    ' ',
    hours < 10 ? '0' : '',
    hours.toString(),
    ':',
    minutes < 10 ? '0' : '',
    minutes.toString(),
  );

  const formatted = stringBuffer.join('');
  dateCache.set(key, formatted);
  cleanupCache();

  return formatted;
}

// Cálculo de período inline
function getPeriod(hour: number): string {
  return hour >= 18
    ? PERIODS[3]
    : hour >= 12
      ? PERIODS[2]
      : hour >= 6
        ? PERIODS[1]
        : PERIODS[0];
}

// Função para cálculo de percentual com cache
function calculatePercentage(part: number, total: number): string {
  if (total === 0) return '0';

  const key = `${part}-${total}`;
  let cached = percentageCache.get(key);
  if (cached) return cached;

  const result = ((part / total) * 100).toFixed(1);
  percentageCache.set(key, result);
  return result;
}

export function ShortOohPrompt(data: IPopulatedDisplayLog): string {
  // Verificações e extrações em uma única passada
  const isAd = data.type === DisplayType.ADVERTISEMENT;
  const content = isAd ? data.advertisement : data.news;
  const localUnit = data.local_unit || {};
  const yolo = data.yolo || ApiYoloResultDefault;
  const insightface = data.insightface || ApiDetectInsightfaceDefault;

  // Cálculos de tempo otimizados
  const startTime = new Date(data.start_at);
  const duration = data.seconds || 0;
  const formattedDateTime = fastDateFormat(startTime);

  // Análise demográfica em uma única passada
  const totalPeople = insightface.total || yolo.people || 0;
  const hasPeople = totalPeople > 0;

  let menCount = 0,
    womenCount = 0,
    menPercentage = '0',
    womenPercentage = '0';
  if (hasPeople) {
    menCount = insightface.men || 0;
    womenCount = insightface.women || 0;
    menPercentage = calculatePercentage(menCount, totalPeople);
    womenPercentage = calculatePercentage(womenCount, totalPeople);
  }

  // Extração de dados com fallbacks otimizados
  const averageAge = insightface.age?.average || NA_VALUE;
  const ageRange = insightface.age
    ? `${insightface.age.min}-${insightface.age.max} anos`
    : NA_VALUE;
  const tipoLocal =
    LOCATION_MAP.get(localUnit.type) || localUnit.type || DEFAULT_LOCATION;

  // Valores derivados calculados uma vez
  const contentTitle = content?.title || NA_VALUE;
  const contentType = isAd ? 'ANÚNCIO' : 'NOTÍCIA';
  const localName = localUnit.name || NA_VALUE;
  const audienceStatus = hasPeople
    ? 'Desempenho e insights principais.'
    : 'Sem audiência detectada.';
  const engagementInfo = hasPeople ? 'Engajamento por gênero/idade' : NA_VALUE;
  const retentionStatus = duration > 10 ? 'Boa retenção' : 'Baixa retenção';

  // Template string construída uma única vez - Versão ultra-compatível
  return `gere em pt-br | ANALISTA OOH: Forneça insights acionáveis baseados nos dados.

DADOS:
Conteúdo: ${contentTitle} | ${contentType}
Local: ${localName} (${tipoLocal})
Data/Hora: ${formattedDateTime} (${duration}s)
Audiência: ${totalPeople} pessoas | ${menPercentage}% homens, ${womenPercentage}% mulheres | Idade: ${ageRange} (média: ${averageAge})

ANÁLISE SOLICITADA:

RESUMO
${audienceStatus}

AUDIÊNCIA
Perfil detectado vs esperado
${engagementInfo}

CRIATIVO
Eficácia do título/mensagem
${retentionStatus}

RECOMENDAÇÕES
2-3 otimizações prioritárias
Próximo teste A/B

INSTRUÇÕES: Responda em máximo 300 palavras usando formatação Markdown estruturada.`;
}
