import { Injectable } from '@nestjs/common';
import {
  GenerateContentResponse,
  GenerateContentResponseUsageMetadata,
  GoogleGenAI,
} from '@google/genai';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { GoogleGenAiModelsEnum as Models } from './llm.interface';

interface GenerationOptions {
  recordId: string;
  stream: boolean;
  signal?: AbortSignal;
}

const legacyVertexModels = {
  [Models.DEEPSEEK_R1_0528_MAAS]: {
    model: 'deepseek-ai/deepseek-r1-0528-maas',
    location: 'us-central1',
  },
  [Models.META_LLAMA_4_MAVERICK_17B_128E_INSTRUCT_MAAS]: {
    model: 'meta/llama-4-maverick-17b-128e-instruct-maas',
    location: 'us-east5',
  },
};

function getText(response: GenerateContentResponse) {
  return (response.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('');
}

@Injectable()
export class GoogleGenAiProvider {
  resolveModel(selection: Models): string {
    switch (selection) {
      case Models.DEFAULT:
      case Models.GEMINI_2_0_FLASH_001: {
        const configured = process.env.GOOGLE_GENAI_DEFAULT_MODEL?.trim();
        if (!configured || /^gemini-2\.0-flash(?:-001)?$/.test(configured)) {
          return Models.GEMINI_3_5_FLASH_LITE;
        }
        return configured === 'gemini-2.5-pro'
          ? Models.GEMINI_3_8_FLASH
          : configured;
      }
      case Models.GEMINI_2_5_PRO:
        return Models.GEMINI_3_8_FLASH;
      case Models.DEEPSEEK_R1_0528_MAAS:
      case Models.META_LLAMA_4_MAVERICK_17B_128E_INSTRUCT_MAAS:
        return legacyVertexModels[selection].model;
      default:
        return selection;
    }
  }

  async *generateContent(
    prompt: string,
    selection: Models,
    { recordId, stream, signal }: GenerationOptions,
  ): AsyncGenerator<string> {
    const model = this.resolveModel(selection);
    const vertex = legacyVertexModels[selection];
    const streaming =
      stream &&
      (Boolean(vertex) || process.env.GOOGLE_GENAI_STREAMING !== 'false');
    let usage: GenerateContentResponseUsageMetadata | undefined;
    let modelVersion: string | undefined;
    let completed = false;

    try {
      const client = vertex
        ? new GoogleGenAI({
            vertexai: true,
            project: 'rare-tape-466414-f4',
            location: vertex.location,
          })
        : new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
      const request = {
        model,
        contents: prompt,
        config: {
          abortSignal: signal,
          ...(!streaming && stream && { maxOutputTokens: 4096 }),
        },
      };
      const responses = streaming
        ? await client.models.generateContentStream(request)
        : [await client.models.generateContent(request)];

      for await (const response of responses) {
        modelVersion = response.modelVersion ?? modelVersion;
        if (response.usageMetadata) {
          // Stream metadata is cumulative. Later chunks can omit fields.
          usage = { ...usage, ...response.usageMetadata };
        }
        const text = getText(response);
        if (text) yield text;
      }
      completed = true;
    } finally {
      Log(
        LogType.INFO,
        GoogleGenAiProvider.name,
        'tokens',
        LogAction.FINISHED,
        {
          recordId,
          model,
          modelVersion: modelVersion ?? null,
          provider: vertex ? 'vertex-ai' : 'gemini-api',
          source: stream ? 'manual' : 'queue',
          streaming,
          status: completed ? 'complete' : 'interrupted',
          inputTokens: usage?.promptTokenCount ?? null,
          outputTokens: usage?.candidatesTokenCount ?? null,
          thinkingTokens: usage?.thoughtsTokenCount ?? null,
          cachedInputTokens: usage?.cachedContentTokenCount ?? null,
          totalTokens: usage?.totalTokenCount ?? null,
        },
      );
    }
  }
}
