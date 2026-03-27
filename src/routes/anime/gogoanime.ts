import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { ANIME } from '@consumet/extensions';
import axios from 'axios';
import { load } from 'cheerio';
import { safeUnpack } from '@consumet/extensions/dist/utils/utils';

type SourceItem = {
  url: string;
  isM3U8: boolean;
  quality?: string;
  isDub?: boolean;
};

const ANIMEPAHE_BASE_URL = 'https://animepahe.si';

const animePaheHeaders = (sessionId?: string) => ({
  authority: 'animepahe.si',
  accept: 'application/json, text/javascript, */*; q=0.01',
  'accept-language': 'en-US,en;q=0.9',
  cookie: '__ddg2_=;',
  dnt: '1',
  'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  referer: sessionId
    ? `${ANIMEPAHE_BASE_URL}/anime/${sessionId}`
    : `${ANIMEPAHE_BASE_URL}`,
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
});

const browserHeaders = (referer: string) => ({
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: referer,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
});

const extractKwikSource = async (kwikUrl: string): Promise<SourceItem> => {
  const response = await fetch(kwikUrl, {
    headers: browserHeaders(`${ANIMEPAHE_BASE_URL}/`),
  });

  const html = await response.text();
  const packedMatch = /;(eval)(\(f[\s\S]*?)(\n<\/script>)/.exec(html);
  if (!packedMatch || !packedMatch[2]) {
    throw new Error('kwik packed script not found (likely anti-bot or layout changed)');
  }

  const unpacked = safeUnpack(packedMatch[2]);
  const m3u8Match = unpacked.match(/https.*?m3u8/);
  if (!m3u8Match || !m3u8Match[0]) {
    throw new Error('m3u8 source not found after kwik unpack');
  }

  return {
    url: m3u8Match[0],
    isM3U8: true,
  };
};

const fetchAnimePaheEpisodeSources = async (episodeId: string) => {
  const playUrl = `${ANIMEPAHE_BASE_URL}/play/${episodeId}`;
  const animeSessionId = episodeId.split('/')[0];
  const playPage = await axios.get(playUrl, {
    headers: {
      ...browserHeaders(`${ANIMEPAHE_BASE_URL}/anime/${animeSessionId}`),
      ...animePaheHeaders(animeSessionId),
    },
  });

  const $ = load(playPage.data);
  const links = $('div#resolutionMenu > button')
    .map((_, el) => ({
      url: $(el).attr('data-src') || '',
      quality: ($(el).text() || '').trim(),
      audio: $(el).attr('data-audio') || '',
    }))
    .get()
    .filter((item) => !!item.url);

  const downloads = $('div#pickDownload > a')
    .map((_, el) => ({
      url: $(el).attr('href') || '',
      quality: ($(el).text() || '').trim(),
    }))
    .get()
    .filter((item) => !!item.url);

  const sources: SourceItem[] = [];
  const errors: string[] = [];

  for (const link of links) {
    try {
      const source = await extractKwikSource(link.url);
      source.quality = link.quality;
      source.isDub = link.audio === 'eng';
      sources.push(source);
    } catch (error: any) {
      errors.push(`${link.quality || 'unknown'}: ${error?.message || 'unknown error'}`);
    }
  }

  return {
    headers: {
      Referer: 'https://kwik.cx/',
    },
    sources,
    download: downloads,
    errors,
  };
};

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  // Gogoanime 已被棄用，此路由改用 AnimePahe 作為替代。
  const provider = new ANIME.AnimePahe();

  fastify.get('/gogoanime', (_, rp) => {
    rp.status(200).send({
      message: '此 gogoanime 路由實際使用 AnimePahe provider。',
      routes: ['/:query', '/info/*', '/watch/*'],
    });
  });

  // 搜索動漫
  fastify.get(
    '/gogoanime/:query',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { query } = request.params as { query: string };

      try {
        const res = await provider.search(query);
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(err, `Gogoanime (AnimePahe) search failed for query: ${query}`);
        reply.status(500).send({ error: err.message });
      }
    },
  );

  // 獲取詳情
  // 獲取詳情 - 🌟 這裡也要改成 *，因為 AnimePahe 的 ID 也有斜線
  fastify.get(
    '/gogoanime/info/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 🌟 統一使用這種方式獲取 ID
      const id = (request.params as any)['*'];
      try {
        const res = await provider.fetchAnimeInfo(id);
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(err, `Gogoanime (AnimePahe) info fetch failed for id: ${id}`);
        reply.status(404).send({ message: 'Anime info not found', error: err.message });
      }
    },
  );

  // 獲取播放連結
  fastify.get(
    '/gogoanime/watch/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.params as any)['*'];

      try {
        try {
          const directRes = await provider.fetchEpisodeSources(episodeId);
          return reply.status(200).send(directRes);
        } catch (primaryErr: any) {
          fastify.log.warn(
            primaryErr,
            `Primary AnimePahe provider failed; falling back for episodeId: ${episodeId}`,
          );
        }

        const res = await fetchAnimePaheEpisodeSources(episodeId);

        if (res.sources.length === 0 && res.download.length === 0) {
          return reply.status(404).send({
            message: 'Sources not found',
            error:
              res.errors[0] ||
              'No playable sources were extracted. This can happen due to upstream anti-bot checks.',
            details: res.errors,
          });
        }

        return reply.status(200).send({
          headers: res.headers,
          sources: res.sources,
          download: res.download,
          ...(res.errors.length > 0 ? { partialErrors: res.errors } : {}),
        });
      } catch (err: any) {
        fastify.log.error(
          err,
          `Gogoanime (AnimePahe) watch fetch failed for episodeId: ${episodeId}`,
        );
        reply.status(404).send({
          message: 'Sources not found',
          error: err.message,
          hint: 'Upstream provider may be blocking serverless IP ranges. Try another region or provider.',
        });
      }
    },
  );
};

export default routes;
