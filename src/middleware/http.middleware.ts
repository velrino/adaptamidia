import { Injectable, NestMiddleware } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';
import { Request, Response, NextFunction } from 'express';
import { IpSourceEnum } from 'src/shared/enums/ip-source.enum';
import { RequestCustomClient } from 'src/shared/request';

@Injectable()
export class HttpMiddleware implements NestMiddleware {
  constructor() {}

  use(req: Request, _: Response, next: NextFunction) {
    const getIpSource = (headers: Record<string, any>) => {
      const ipMapping: { [key: string]: IpSourceEnum } = {
        'cf-connecting-ip': IpSourceEnum.Cloudflare, // IP vindo da Cloudflare
        'x-forwarded-for': IpSourceEnum.Proxy, // IP vindo de proxies ou load balancers
        'x-real-ip': IpSourceEnum.Proxy, // IP configurado por proxies como NGINX
        forwarded: IpSourceEnum.Proxy, // Cabeçalho Forwarded padrão para IP
        'x-cluster-client-ip': IpSourceEnum.Cluster, // IP em ambiente de cluster
        'true-client-ip': IpSourceEnum.Akamai, // IP vindo de CDNs como Akamai
      };

      return Object.keys(ipMapping).find((header) => headers[header])
        ? ipMapping[
            Object.keys(ipMapping).find((header) => headers[header]) as any
          ]
        : IpSourceEnum.Direct;
    };

    const userAgent =
      (Array.isArray(req.headers['x-device-user-agent']) // Dispositivo original (proxies)
        ? req.headers['x-device-user-agent'][0]
        : req.headers['x-device-user-agent']) ||
      (Array.isArray(req.headers['x-original-user-agent']) // User-agent original (modificado por proxies)
        ? req.headers['x-original-user-agent'][0]
        : req.headers['x-original-user-agent']) ||
      (Array.isArray(req.headers['x-operamini-phone-ua']) // User-agent do Opera Mini
        ? req.headers['x-operamini-phone-ua'][0]
        : req.headers['x-operamini-phone-ua']) ||
      (Array.isArray(req.headers['x-ucbrowser-device-ua']) // User-agent do UC Browser
        ? req.headers['x-ucbrowser-device-ua'][0]
        : req.headers['x-ucbrowser-device-ua']) ||
      (Array.isArray(req.headers['user-agent']) // Cabeçalho padrão
        ? req.headers['user-agent'][0]
        : req.headers['user-agent']) ||
      'Unknown';

    const userAgentParsed = UAParser(userAgent);

    const headersRest = { ...req.headers };

    delete headersRest['authorization'];

    const client: RequestCustomClient = {
      ip: String(
        // Verifica o cabeçalho 'cf-connecting-ip', adicionado pela Cloudflare para identificar o IP real do cliente.
        req.headers['cf-connecting-ip'] ||
          // Verifica o cabeçalho 'x-forwarded-for', que é comumente usado por proxies e load balancers
          // para passar o endereço IP do cliente original. Pode conter uma lista de IPs se houver múltiplos proxies.
          req.headers['x-forwarded-for'] ||
          // Verifica o cabeçalho 'x-real-ip', que pode ser configurado por proxies ou servidores como NGINX para fornecer o IP real do cliente.
          req.headers['x-real-ip'] ||
          // Verifica o cabeçalho 'forwarded', que é um padrão mais recente para passar o IP e outras informações sobre a conexão do cliente.
          req.headers['forwarded'] ||
          // Verifica o cabeçalho 'x-cluster-client-ip', usado em algumas arquiteturas para identificar o IP real do cliente quando a requisição passa por clusters.
          req.headers['x-cluster-client-ip'] ||
          // Verifica o cabeçalho 'true-client-ip', utilizado por alguns serviços como Akamai para passar o IP real do cliente através de proxies ou CDNs.
          req.headers['true-client-ip'] ||
          // Se nenhum dos cabeçalhos anteriores estiver presente, usa o IP direto da requisição, que é o IP visível para o servidor.
          req.ip,
      ),
      latitude: Number(
        req.headers['cf-iplatitude'] || // Cloudflare latitude
          req.headers['x-latitude'] || // Custom proxy latitude header
          req.headers['geolocation-latitude'] || // Geolocation header (pode ser customizado)
          req.headers['x-geo-latitude'] || // Usado por alguns proxies e redes para latitude
          req.headers['fastly-client-latitude'] || // Fastly latitude
          req.headers['x-vercel-ip-latitude'] || // Vercel latitude
          0, // Valor padrão se nenhum cabeçalho estiver presente
      ),

      longitude: Number(
        req.headers['cf-iplongitude'] || // Cloudflare longitude
          req.headers['x-longitude'] || // Custom proxy longitude header
          req.headers['geolocation-longitude'] || // Geolocation header (pode ser customizado)
          req.headers['x-geo-longitude'] || // Usado por alguns proxies e redes para longitude
          req.headers['fastly-client-longitude'] || // Fastly longitude
          req.headers['x-vercel-ip-longitude'] || // Vercel longitude
          0, // Valor padrão se nenhum cabeçalho estiver presente
      ),
      source: getIpSource(req.headers),
      timezone: Array.isArray(req.headers['x-timezone'])
        ? req.headers['x-timezone'][0] || 'UTC' // Take first if array
        : req.headers['x-timezone'] || 'UTC',
      // Adicionando o campo userAgent para capturar o cabeçalho 'user-agent'
      ...userAgentParsed,
      headers: headersRest,
    };

    req['custom_client'] = client;

    next();
  }
}
