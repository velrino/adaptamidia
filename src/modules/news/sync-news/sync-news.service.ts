import { Injectable } from '@nestjs/common';
import * as NewsAPI from 'newsapi';
import {
  INewsApiResponse,
  LanguageEnum,
  NewsKeywordEnum,
  NewsProviderEnum,
} from '../news.interface';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { News, NewsDocument } from '../news.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';

@Injectable()
export class SyncNewsService {
  private readonly newsapi: NewsAPI = new NewsAPI(
    'REDACTED',
  );

  constructor(
    @InjectModel(News.name)
    readonly model: Model<NewsDocument>,
  ) {
    // this.providerNewsApi = new NewsAPI('SUA_API_KEY');
  }

  async onApplicationBootstrap() {
    await this.execute();
    console.log('Syncing news data...');
  }

  async getNewsEverythingAbout(q: string): Promise<INewsApiResponse> {
    try {
      return await this.newsapi.v2.everything({
        language: 'pt', // Português
        // country: 'br', // Brasil
        sortBy: 'popularity',
        pageSize: 20, // Limita a 10 notícias
        q,
      });
    } catch (error) {
      throw new Error(`Erro ao buscar notícias: ${error.message}`);
    }
  }

  async execute() {
    const keywords = Object.values(NewsKeywordEnum);
    const timeAgo = DateTime.utc().minus({ hour: 1 }).toJSDate();
    // await this.model.deleteMany({});
    for (let index = 0; index < keywords.length; index++) {
      const keyword = keywords[index];

      const count = await this.model.countDocuments({
        keyword,
        created_at: { $gte: timeAgo },
      });

      if (count > 0) {
        Log(
          LogType.INFO,
          SyncNewsService.name,
          this.execute.name,
          LogAction.SKIP,
          { keyword, data: count },
        );
        continue;
      }

      const list = await this.getNewsEverythingAbout(keyword);
      const provider = NewsProviderEnum.NEWS_API;

      if (!list.articles.length) {
        Log(
          LogType.ERROR,
          SyncNewsService.name,
          this.execute.name,
          LogAction.EMPTY,
          { keyword, data: list.articles.length },
        );
        continue;
      }

      const created: any[] = [];
      for (let index = 0; index < list.articles.length; index++) {
        const item = list.articles[index];

        if (
          !item.author ||
          !item.urlToImage ||
          !item.author ||
          !item.title ||
          !item.url ||
          !item?.source?.name
        ) {
          continue;
        }

        const countFromSameUrl = await this.model.countDocuments({
          url: item.url,
        });

        if (countFromSameUrl > 0) {
          Log(
            LogType.INFO,
            SyncNewsService.name,
            this.execute.name,
            LogAction.SKIP,
            { about: 'DUPLICATE', keyword, data: countFromSameUrl },
          );
          continue;
        }

        const currentData = {
          source_id: item.source.id,
          source_name: item.source.name,
          title: item.title,
          author: item.author,
          description: item.description,
          url: item.url,
          image: item.urlToImage,
          published_at: new Date(item.publishedAt),
        };

        const create = await this.model.create({
          keyword,
          provider,
          language: LanguageEnum.PT_BR,
          ...currentData,
        });

        created.push(create._id);
      }

      Log(
        LogType.INFO,
        SyncNewsService.name,
        this.execute.name,
        LogAction.SUCCESS,
        { keyword, data: list.articles.length, created },
      );
    }
  }
}
