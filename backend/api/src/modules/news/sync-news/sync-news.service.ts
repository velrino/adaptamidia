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
import { Environments, GetEnvironment, LockKeyName } from 'src/shared/general';

export const ExcludeDomains = ['GlobeNewswire'];

const hourMs = 60 * 60 * 1000;
const dailyIntervalMs = 24 * hourMs;

interface NewsSyncState {
  _id: string;
  nextRunAt: Date;
}

function isQuotaError(error: unknown) {
  return (
    error instanceof Error &&
    ['NewsAPIError: rateLimited', 'NewsAPIError: apiKeyExhausted'].includes(
      error.name,
    )
  );
}

@Injectable()
export class SyncNewsService {
  private readonly apiTokens = [
    ...new Set(
      (process.env.NEWS_API_KEYS ?? '')
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  ];
  private currentTokenIndex = 0;

  constructor(
    @InjectModel(News.name)
    readonly model: Model<NewsDocument>,
  ) {}

  onApplicationBootstrap() {
    void this.execute();
  }

  private getNextApiToken(): string {
    const token = this.apiTokens[this.currentTokenIndex];
    this.currentTokenIndex =
      (this.currentTokenIndex + 1) % this.apiTokens.length;
    return token;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    await this.execute();
  }

  async getNewsEverythingAbout(
    token: string,
    q: string,
  ): Promise<INewsApiResponse> {
    const newsapi: NewsAPI = new NewsAPI(token);
    return newsapi.v2.everything({
      language: 'pt',
      sortBy: 'popularity',
      excludeDomains: ExcludeDomains.join(','),
      pageSize: 100,
      q,
    });
  }

  private async reserveSync(now: Date, nextRunAt: Date) {
    try {
      const result = await this.syncState.updateOne(
        { _id: LockKeyName('sync-news') },
        [
          {
            $set: {
              nextRunAt: {
                $cond: [
                  { $lte: [{ $ifNull: ['$nextRunAt', now] }, now] },
                  nextRunAt,
                  '$nextRunAt',
                ],
              },
            },
          },
        ],
        { upsert: true },
      );
      return result.modifiedCount === 1 || result.upsertedCount === 1;
    } catch (error) {
      // Concurrent processes can race to create the first checkpoint.
      if (error?.code === 11000) return false;
      throw error;
    }
  }

  private get syncState() {
    return this.model.db.collection<NewsSyncState>('news_sync_state');
  }

  async execute() {
    try {
      if (!this.apiTokens.length) return;

      const production = Object.values(Environments).some(
        (environment) => environment === GetEnvironment(),
      );
      const now = new Date();
      const nextRunAt = new Date(
        now.getTime() + (production ? 3 * hourMs : dailyIntervalMs),
      );
      // Reserve before calling the provider so a restart cannot replay the batch.
      if (!(await this.reserveSync(now, nextRunAt))) return;

      const limitedTokens = new Set<string>();
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

        while (attemptsMade < maxAttempts) {
          attemptsMade++;
          const apiToken = this.getNextApiToken();
          if (limitedTokens.has(apiToken)) continue;

          try {
            const response = await this.getNewsEverythingAbout(
              apiToken,
              keyword,
            );
            articles = response.articles.filter(
              ({ author, urlToImage, title, url, source }) =>
                author && urlToImage && title && url && source?.name,
            );
            break;
          } catch (error) {
            if (!isQuotaError(error)) throw error;

            limitedTokens.add(apiToken);
            if (limitedTokens.size === maxAttempts) {
              const retryAt = new Date(Date.now() + dailyIntervalMs);
              await this.syncState.updateOne(
                { _id: LockKeyName('sync-news'), nextRunAt },
                { $max: { nextRunAt: retryAt } },
              );
              Log(
                LogType.INFO,
                SyncNewsService.name,
                this.execute.name,
                LogAction.SKIP,
                { about: RESULT.NEWS_LIMIT_REACHED, retryAt },
              );
              return;
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
