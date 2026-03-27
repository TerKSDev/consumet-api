import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
// 🌟 1. 改為引入 META 模組
import { META, ANIME } from '@consumet/extensions';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  // 🌟 2. 實例化 Anilist (這會是你用過最穩、資料最豐富的 Provider)
  const provider = new META.Anilist(new ANIME.AnimePahe());

  fastify.get('/gogoanime', (_, rp) => {
    rp.status(200).send({
      message: 'Hianime provider is active (Mapped to /gogoanime route).',
      routes: ['/:query', '/info/*', '/watch/*'],
    });
  });

  // 1. 搜索動漫
  fastify.get(
    '/gogoanime/:query',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { query } = request.params as { query: string };

      try {
        const res = await provider.search(query);
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(err, `Hianime search failed for query: ${query}`);
        reply.status(500).send({ error: err.message });
      }
    },
  );

  // 2. 獲取詳情與集數列表
  fastify.get(
    '/gogoanime/info/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = (request.params as any)['*'];
      try {
        const res = await provider.fetchAnimeInfo(id);
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(err, `Hianime info fetch failed for id: ${id}`);
        reply.status(404).send({ message: 'Anime info not found', error: err.message });
      }
    },
  );

  // 3. 獲取最終播放連結 (.m3u8)
  fastify.get(
    '/gogoanime/watch/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.params as any)['*'];

      try {
        const res = await provider.fetchEpisodeSources(episodeId);

        if (!res.sources || res.sources.length === 0) {
          return reply.status(404).send({ message: '無可用的播放源' });
        }

        return reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(err, `Hianime watch fetch failed for episodeId: ${episodeId}`);
        reply.status(404).send({
          message: 'Sources not found',
          error: err.message,
        });
      }
    },
  );
};

export default routes;
