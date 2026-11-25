export interface AiStreamChunk {
  text: string;
}

export enum GoogleGenAiModelsEnum {
  GEMINI_2_0_FLASH_001 = 'GEMINI_2_0_FLASH_001',
  GEMINI_2_5_PRO = 'GEMINI_2_5_PRO',
  DEEPSEEK_R1_0528_MAAS = 'DEEPSEEK_R1_0528_MAAS',
  META_LLAMA_4_MAVERICK_17B_128E_INSTRUCT_MAAS = 'META_LLAMA_4_MAVERICK_17B_128E_INSTRUCT_MAAS',
}

export interface IGoogleGenAiModelConfig {
  model: string;
  vertexai: boolean;
  location?: string;
  project?: string;
}

export const GoogleGenAiModels: Record<
  GoogleGenAiModelsEnum,
  IGoogleGenAiModelConfig
> = {
  [GoogleGenAiModelsEnum.GEMINI_2_0_FLASH_001]: {
    model: 'gemini-2.0-flash-001',
    vertexai: false,
  },
  [GoogleGenAiModelsEnum.GEMINI_2_5_PRO]: {
    model: 'gemini-2.5-pro',
    vertexai: false,
  },
  [GoogleGenAiModelsEnum.DEEPSEEK_R1_0528_MAAS]: {
    model: 'deepseek-ai/deepseek-r1-0528-maas',
    location: 'us-central1',
    project: 'rare-tape-466414-f4',
    vertexai: true,
  },
  [GoogleGenAiModelsEnum.META_LLAMA_4_MAVERICK_17B_128E_INSTRUCT_MAAS]: {
    model: 'meta/llama-4-maverick-17b-128e-instruct-maas',
    location: 'us-east5',
    project: 'rare-tape-466414-f4',
    vertexai: true,
  },
};
