import { Injectable } from '@nestjs/common';
import * as NewsAPI from 'newsapi';
import {
  INewsApiArticle,
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
import { RESULT } from 'src/shared/result.enum';

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

  //   async onApplicationBootstrap() {
  //     await this.execute();
  //     console.log('Syncing news data...');
  //   }

  async getNewsEverythingAbout(q: string): Promise<INewsApiResponse> {
    try {
      return await this.newsapi.v2.everything({
        language: 'pt', // Português
        // country: 'br', // Brasil
        sortBy: 'popularity',
        pageSize: 100, // Limita a 10 notícias
        q,
      });
    } catch (error) {
      throw new Error(`Erro ao buscar notícias: ${error.message}`);
    }
  }

  async execute() {
    // await this.model.deleteMany({});

    const timeAgo = DateTime.utc().minus({ hour: 1 }).toJSDate();
    const provider = NewsProviderEnum.NEWS_API;
    const keywords = Object.values(NewsKeywordEnum);
    const minRecentNews = 10;

    for (const keyword of keywords) {
      const newsCount = await this.model.countDocuments({
        keyword,
        created_at: { $gte: timeAgo },
      });

      if (newsCount > minRecentNews) {
        Log(
          LogType.INFO,
          SyncNewsService.name,
          this.execute.name,
          LogAction.SKIP,
          {
            about: RESULT.NEWS_RECENT_EXIST,
            keyword,
          },
        );
        continue;
      }

      const articles: INewsApiArticle[] = await this.getNewsEverythingAbout(
        keyword,
      ).then((res) =>
        res.articles.filter(
          ({ author, urlToImage, title, url, source }) =>
            author && urlToImage && title && url && source?.name,
        ),
      );

      if (!articles.length) {
        Log(
          LogType.INFO,
          SyncNewsService.name,
          this.execute.name,
          LogAction.SKIP,
          {
            about: RESULT.NEWS_NO_VALID_ARTICLES,
            keyword,
          },
        );
        continue;
      }

      const existingUrls = new Set(
        await this.model
          .find({ url: { $in: articles.map(({ url }) => url) } }, 'url')
          .then((docs) => docs.map(({ url }) => url)),
      );

      const newArticles = articles.filter(({ url }) => !existingUrls.has(url));
      if (!newArticles.length) {
        Log(
          LogType.INFO,
          SyncNewsService.name,
          this.execute.name,
          LogAction.SKIP,
          {
            about: RESULT.NEWS_ALL_ARTICLES_ARE_DUPLICATES,
            keyword,
          },
        );
        continue;
      }

      const created = await this.model.insertMany(
        newArticles.map(
          ({
            source,
            title,
            author,
            description,
            url,
            urlToImage,
            publishedAt,
          }) => ({
            keyword,
            provider,
            language: LanguageEnum.PT_BR,
            source_id: source.id,
            source_name: source.name,
            title,
            author,
            description,
            url,
            image: urlToImage,
            published_at: new Date(publishedAt),
          }),
        ),
      );

      Log(
        LogType.INFO,
        SyncNewsService.name,
        this.execute.name,
        LogAction.SKIP,
        {
          about: RESULT.NEWS_ALL_ARTICLES_SAVED,
          keyword,
          created: created.map(({ _id }) => _id),
        },
      );
    }
  }
}
