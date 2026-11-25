import { Injectable } from '@nestjs/common';
import * as NewsAPI from 'newsapi';
import {
  INewsApiArticle,
  INewsApiResponse,
  LanguageEnum,
  NewsKeywordEnum,
  NewsProviderEnum,
  NewsStatusEnum,
} from '../news.interface';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { News, NewsDocument } from '../news.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { RESULT } from 'src/shared/result.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseDatabaseService } from 'src/shared/firebase/firebase-database.service';
import { LockKeyName } from 'src/shared/general';

export const ExcludeDomains = ['GlobeNewswire'];

@Injectable()
export class SyncNewsService {
  private readonly apiTokens = (process.env.NEWS_API_KEYS ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  private currentTokenIndex = 0;

  constructor(
    @InjectModel(News.name)
    readonly model: Model<NewsDocument>,
    private readonly firebaseDb: FirebaseDatabaseService,
  ) {}

  async onApplicationBootstrap() {
    await this.execute();
  }

  private getNextApiToken(): string {
    const token = this.apiTokens[this.currentTokenIndex];
    this.currentTokenIndex =
      (this.currentTokenIndex + 1) % this.apiTokens.length;
    return token;
  }

  @Cron(CronExpression.EVERY_3_HOURS)
  async handleCron() {
    if (!this.apiTokens.length) return;

    const lockName = LockKeyName(`sync-news`);
    const leaseMs = 30 * 60 * 1000; // 30 minutos (ajuste conforme duração esperada)
    const acquired = await this.firebaseDb.acquireLock(lockName, leaseMs);

    if (!acquired) {
      Log(
        LogType.INFO,
        SyncNewsService.name,
        this.handleCron.name,
        LogAction.SKIP,
        { about: 'LOCK_NOT_ACQUIRED', lockName },
      );
      // return;
    }

    try {
      await this.execute();
    } finally {
      await this.firebaseDb.releaseLock(lockName);
    }
  }

  async getNewsEverythingAbout(
    token: string,
    q: string,
  ): Promise<INewsApiResponse> {
    try {
      const newsapi: NewsAPI = new NewsAPI(token);

      return await newsapi.v2.everything({
        language: 'pt', // Português
        // country: 'br', // Brasil
        sortBy: 'popularity',
        excludeDomains: ExcludeDomains.join(','),
        pageSize: 100, // Limita a 10 notícias
        q,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async execute() {
    try {
      if (!this.apiTokens.length) return;

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

        let articles: INewsApiArticle[] = [];
        let attemptsMade = 0;
        const maxAttempts = this.apiTokens.length;

        while (attemptsMade < maxAttempts && articles.length === 0) {
          attemptsMade++;
          const apiToken = this.getNextApiToken();

          try {
            articles = await this.getNewsEverythingAbout(
              apiToken,
              keyword,
            ).then((res) =>
              res.articles.filter(
                ({ author, urlToImage, title, url, source }) =>
                  author && urlToImage && title && url && source?.name,
              ),
            );

            if (articles.length > 0) {
              break; // Sucesso, sair do loop
            }
          } catch (error) {
            if (attemptsMade < maxAttempts) {
              Log(
                LogType.ERROR,
                SyncNewsService.name,
                this.getNewsEverythingAbout.name,
                LogAction.FAILED,
                {
                  about: RESULT.NEWS_LIMIT_REACHED,
                  keyword,
                  tokenIndex: this.currentTokenIndex - 1,
                  attemptNumber: attemptsMade,
                },
              );
            } else {
              // Todos os tokens falharam
              Log(
                LogType.ERROR,
                SyncNewsService.name,
                this.getNewsEverythingAbout.name,
                LogAction.FAILED,
                {
                  about: 'ALL_TOKENS_EXHAUSTED',
                  keyword,
                  totalAttempts: attemptsMade,
                },
              );
              throw error; // Re-lançar o erro se todos os tokens falharam
            }
          }
        }

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

        const newArticles = articles.filter(
          ({ url }) => !existingUrls.has(url),
        );
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
          newArticles
            .filter((item) => !ExcludeDomains.includes(item.source.name))
            .map(
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
                status: NewsStatusEnum.ACTIVE,
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
            tokenIndex: this.currentTokenIndex,
            created: created.length,
          },
        );
      }
    } catch (error) {
      Log(
        LogType.ERROR,
        SyncNewsService.name,
        this.execute.name,
        LogAction.FAILED,
        {
          error,
        },
      );
    }
  }
}
