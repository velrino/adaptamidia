import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  AiStreamChunk,
  GoogleGenAiModels,
  GoogleGenAiModelsEnum,
} from './llm.interface';

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
  }

  async *generateContentStream(
    prompt: string,
    currentModel: GoogleGenAiModelsEnum,
  ): AsyncGenerator<AiStreamChunk> {
    const modelChosed = GoogleGenAiModels[currentModel];

    const client = modelChosed.vertexai
      ? new GoogleGenAI({
          apiKey: process.env.GOOGLE_GENAI_API_KEY,
          location: modelChosed.location,
          project: modelChosed.project,
          vertexai: true,
        })
      : new GoogleGenAI({
          apiKey: process.env.GOOGLE_GENAI_API_KEY,
        });

    const result = await client.models.generateContentStream({
      model: modelChosed.model,
      contents: prompt,
    });

    console.log({ result, modelChosed });

    for await (const chunk of result) {
      const text = chunk.text || '';
      yield { text };
    }
  }
}
