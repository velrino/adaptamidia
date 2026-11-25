import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  AiStreamChunk,
  GoogleGenAiModels,
  GoogleGenAiModelsEnum,
} from './llm.interface';
import { join } from 'path';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { GetGoogleCloudCredential, GoogleCloudCredential } from '../resouces';

export interface GenAiConfig {
  useVertexAI?: boolean;
  location?: string;
  project?: string;
  model?: string;
}

@Injectable()
export class GoogleGenAiProvider {
  private readonly genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    });

    process.env.GOOGLE_APPLICATION_CREDENTIALS = GetGoogleCloudCredential(
      GoogleCloudCredential['rare-tape-466414-f4-a4a31231b9e1.json'],
    );
  }

  async *generateContentStream(
    prompt: string,
    currentModel: GoogleGenAiModelsEnum,
  ): AsyncGenerator<AiStreamChunk> {
    const modelChosed = GoogleGenAiModels[currentModel];

    const client = modelChosed.vertexai
      ? new GoogleGenAI({
          location: modelChosed.location,
          project: modelChosed.project,
          vertexai: true,
        })
      : new GoogleGenAI({
          apiKey: process.env.GOOGLE_GENAI_API_KEY,
        });

    const request = {
      model: this.resolveModel(currentModel),
      contents: prompt,
    };

    if (!modelChosed.vertexai && process.env.GOOGLE_GENAI_STREAMING === 'false') {
      const response = await client.models.generateContent({
        ...request,
        config: { maxOutputTokens: 1200 },
      });
      const text = response.text;
      if (!text) throw new Error('Gemini returned no insight text');
      yield { text };
      return;
    }

    const result = await client.models.generateContentStream(request);
    for await (const chunk of result) {
      const text = chunk.text || '';
      yield { text };
    }
  }

  async generateContent(prompt: string, currentModel: GoogleGenAiModelsEnum) {
    const modelChosed = GoogleGenAiModels[currentModel];

    const client = modelChosed.vertexai
      ? new GoogleGenAI({
          location: modelChosed.location,
          project: modelChosed.project,
          vertexai: true,
        })
      : new GoogleGenAI({
          apiKey: process.env.GOOGLE_GENAI_API_KEY,
        });

    return await client.models.generateContent({
      model: this.resolveModel(currentModel),
      contents: prompt,
    });
  }

  private resolveModel(model: GoogleGenAiModelsEnum): string {
    const configuredModel = GoogleGenAiModels[model].model;
    return model === GoogleGenAiModelsEnum.GEMINI_2_0_FLASH_001
      ? process.env.GOOGLE_GENAI_DEFAULT_MODEL || configuredModel
      : configuredModel;
  }
}
