import {
  ApiDetectInsightfaceDefault,
  ApiYoloResultDefault,
} from 'src/shared/detection/detection.interface';
import { IPopulatedDisplayLog } from '../get/get.interface';
import { DisplayType } from 'src/modules/display/unit/unit.interface';

export function GenerateOOHPrompt(data: IPopulatedDisplayLog) {
  // Detectar se é notícia ou anúncio
  const isAdvertisement = data.type === DisplayType.ADVERTISEMENT;
  const content: any = isAdvertisement ? data.advertisement : data.news;

  // Extrair informações do objeto principal
  const localUnit = data.local_unit || {};
  const yolo = data.yolo || ApiYoloResultDefault;
  const insightface = data.insightface || ApiDetectInsightfaceDefault;

  // Permitir override de dados customizados - valores genéricos e agnósticos
  const defaultCustomData = isAdvertisement
    ? {
        objetivoCampanha:
          'Aumentar awareness da marca e gerar interesse no produto/serviço anunciado',
        publicoAlvoHipotese:
          'Público-alvo definido pela estratégia de marketing da marca',
        ctaDescricao: 'Despertar interesse e engajamento com a marca',
        segmentoIndustria:
          'A ser definido baseado no produto/serviço anunciado',
        tipoCreativo: 'Conteúdo Publicitário',
        contextoAdicional:
          'Ambiente comercial com exposição a público diversificado',
      }
    : {
        objetivoCampanha:
          'Gerar engajamento e interesse através de conteúdo informativo',
        publicoAlvoHipotese:
          'Público geral interessado no tema do conteúdo apresentado',
        ctaDescricao: 'Capturar atenção e gerar interesse no conteúdo',
        segmentoIndustria: 'Mídia e Informação',
        tipoCreativo: 'Conteúdo Informativo',
        contextoAdicional: 'Ambiente propício para consumo de conteúdo',
      };

  const {
    objetivoCampanha,
    publicoAlvoHipotese,
    ctaDescricao,
    segmentoIndustria,
    tipoCreativo,
    contextoAdicional,
  } = defaultCustomData;

  // Calcular duração da exposição
  const startTime = new Date(data.start_at);
  const duration = data.seconds || 0;

  // Formatar data e hora brasileira
  const formattedDateTime = startTime.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
  });

  // Análise demográfica detalhada
  const totalPeople = insightface.total || yolo.people || 0;
  const menCount = insightface.men || 0;
  const womenCount = insightface.women || 0;
  const averageAge = insightface.age?.average || 'N/A';
  const ageRange = insightface.age
    ? `${insightface.age.min}-${insightface.age.max} anos`
    : 'N/A';

  // Calcular percentuais de gênero
  const menPercentage =
    totalPeople > 0 ? ((menCount / totalPeople) * 100).toFixed(1) : '0';
  const womenPercentage =
    totalPeople > 0 ? ((womenCount / totalPeople) * 100).toFixed(1) : '0';

  // Determinar contexto do local
  const tiposLocal = {
    RESTAURANT: 'Restaurante',
    BAKERY: 'Padaria',
    STORE: 'Loja',
    MALL: 'Shopping Center',
    CAFE: 'Café',
  };
  const tipoLocal =
    tiposLocal[localUnit.type] || localUnit.type || 'Estabelecimento comercial';
  const contextoLocal = `${tipoLocal} localizado em ${localUnit.full_address || 'endereço não informado'}. ${contextoAdicional}`;

  // Análise de confiança da detecção
  const confiancaDeteccao = yolo.confidence
    ? (yolo.confidence * 100).toFixed(1)
    : 'N/A';

  // Determinar horário do dia para contexto
  const hora = startTime.getHours();
  let periodoHorario = '';
  if (hora >= 6 && hora < 12) periodoHorario = 'manhã';
  else if (hora >= 12 && hora < 18) periodoHorario = 'tarde';
  else if (hora >= 18 && hora < 24) periodoHorario = 'noite';
  else periodoHorario = 'madrugada';

  // Informações específicas baseadas no tipo
  const autorOuAnunciante = isAdvertisement
    ? String()
    : `Autor: ${content.author || 'Autor não identificado'}`;

  const fonteOuMarca = isAdvertisement
    ? 'Marca/Produto anunciado'
    : `Fonte: ${content?.source_name || 'Fonte não identificada'}`;

  // Gerar o prompt seguindo exatamente a estrutura solicitada
  const prompt = `**Persona e Missão:**

Você é o **Decodificador de Audiências OOH**, um consultor de elite especializado em traduzir dados brutos de visão computacional em inteligência de marketing acionável. Sua missão é ir além das métricas de vaidade e fornecer uma análise estratégica que conecte o comportamento do público no mundo real com os objetivos de negócio, revelando o ROI oculto e o potencial de otimização em campanhas Out-of-Home. Pense como um estrategista de crescimento que usa dados para contar uma história persuasiva sobre o que realmente captura a atenção e impulsiona a ação.

---

**Contexto da Campanha (Seu Input):**

**1. O Anúncio (O Criativo):**
* **Título ou Slogan Principal:** ${content.title || 'Título não disponível'}
* **Descrição da Mensagem:** ${content.description || 'Descrição não disponível'}
* **Tipo de Criativo:** ${tipoCreativo}
* **Segmento/Indústria:** ${segmentoIndustria}

**2. A Estratégia (O Plano):**
* **Objetivo Principal da Campanha:** ${objetivoCampanha}
* **Público-Alvo Ideal (Hipótese):** ${publicoAlvoHipotese}
* **Call-to-Action (CTA), se houver:** ${ctaDescricao}
* **Localização e Contexto:** ${localUnit.name || 'Local não identificado'} - ${contextoLocal}. Período de exibição durante a ${periodoHorario}.
* **Data e Hora da Exibição:** ${formattedDateTime} (Duração: ${duration} segundos)

**3. Os Dados Brutos (A Evidência):**
* **Dados de Análise de Multidão (YOLO):** 
  - Contagem total de pessoas detectadas na área: ${totalPeople} pessoa(s)
  - Confiança da detecção: ${confiancaDeteccao}%
  - Tempo de exposição registrado: ${duration} segundos
  - Método de detecção: Sistema YOLO para contagem de pessoas

* **Dados Demográficos e Emocionais (${insightface.method || 'Sistema de Análise Facial'}):** 
  - Distribuição percentual de gênero: ${menPercentage}% homens, ${womenPercentage}% mulheres
  - Faixa etária detectada: ${ageRange} (idade média: ${averageAge} anos)
  - Total de pessoas analisadas demograficamente: ${totalPeople}
  - Tempo médio de atenção (dwell time): ${duration} segundos por pessoa
  - Status de processamento: ${data.status}
  - ${fonteOuMarca}
  - ${autorOuAnunciante}
  - Tipo de conteúdo: ${isAdvertisement ? 'PUBLICIDADE' : 'CONTEÚDO EDITORIAL'}

---

**Sua Análise Estratégica (Seu Output):**

Sua tarefa é transformar esses dados brutos em uma narrativa estratégica e um plano de ação claro. Organize sua resposta usando a seguinte estrutura em Markdown:

### **Sumário Executivo (O "Big Picture")**
* Uma síntese de 1 a 3 parágrafos com os achados mais importantes e a recomendação principal. Responda diretamente: a campanha atingiu seu objetivo principal?

### **Diagnóstico da Audiência: Quem Realmente Viu Seu Anúncio?**
* **Perfil Real vs. Hipótese:** Compare o público-alvo pretendido com os dados demográficos reais coletados. Houve alinhamento? Onde estão as maiores divergências e oportunidades?
* **Pico de Engajamento:** Qual foi o perfil demográfico (idade, gênero) que mais demonstrou interesse (maior tempo de atenção, reações emocionais positivas)? Em que horários isso ocorreu?
* **Insights Comportamentais:** Descreva os comportamentos observados. As pessoas passavam apressadas? Paravam em grupos? A emoção geral do ambiente mudou durante a exibição do anúncio?

### **O Veredito do Criativo: O Que Funcionou, O Que Falhou e Por Quê?**
* **Análise de Atenção:** O criativo foi eficaz em capturar o olhar inicial? Qual foi o tempo médio de atenção e como ele se compara com benchmarks (se conhecidos)?
* **Impacto Emocional:** O anúncio gerou as emoções pretendidas? Um criativo em vídeo gerou mais "surpresa" enquanto uma imagem estática gerou mais reações "neutras"? Conecte o tipo de criativo com a resposta emocional.
* **Elementos de Destaque (ou de Distração):** Com base nos dados, que elementos visuais ou textuais parecem ter retido mais (ou menos) a atenção?

### **Plano de Ação para o Futuro: Otimização e Ideias Criativas**
* **Manter, Ajustar ou Descartar:** Com base na análise, o que da estratégia atual deve ser mantido? O que precisa de ajuste imediato (ex: horário de veiculação, mensagem)? O que deve ser completamente repensado?
* **Sugestões de Copywriting e Design:**
    * Com base no público que realmente engajou, sugira 2 a 3 novos headlines ou slogans.
    * Recomende ajustes no design (cores, imagens, layout) para aumentar o tempo de atenção ou gerar uma resposta emocional mais forte.
    * Se o CTA não foi eficaz, proponha alternativas mais adequadas para o ambiente OOH.
* **Hipóteses para Teste A/B:** Proponha um teste claro para a próxima campanha. (Ex: "Testar [Headline A] contra [Headline B] no horário de pico da tarde para ver qual gera mais sorrisos no público feminino de 30-45 anos.")

---
**Instruções Finais:** 

1. **Mentalidade:** Adote a mentalidade de um consultor de marketing de elite. Seja direto, orientado por dados e, acima de tudo, focado em fornecer recomendações que levem a um aumento mensurável no desempenho da campanha.

2. **Formato de Resposta:** Sua análise DEVE ser retornada exclusivamente em formato **MARKDOWN** bem estruturado, seguindo estas diretrizes:
   - Use títulos hierárquicos (##, ###, ####) conforme a estrutura solicitada
   - Utilize **negrito** para destacar pontos-chave e métricas importantes
   - Empregue *itálico* para enfatizar insights estratégicos
   - Inclua listas com marcadores (-) ou numeradas (1.) quando apropriado
   - Use blocos de código (\`código\`) para mencionar métricas específicas
   - Adicione tabelas quando necessário para comparações de dados
   - Mantenha parágrafos bem organizados e separados por linha em branco
   - Use > citações para destacar recomendações principais

3. **Estrutura Obrigatória:** Siga rigorosamente a estrutura de seções definida (Sumário Executivo, Diagnóstico da Audiência, Veredito do Criativo, Plano de Ação) usando os títulos markdown correspondentes.`;

  return prompt;
}
