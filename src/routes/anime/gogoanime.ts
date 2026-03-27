import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { ANIME } from '@consumet/extensions';

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
        const res = await provider.fetchEpisodeSources(episodeId);
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(
          err,
          `Gogoanime (AnimePahe) watch fetch failed for episodeId: ${episodeId}`,
        );
        reply.status(404).send({ message: 'Sources not found', error: err.message });
      }
    },
  );
};

export default routes;
