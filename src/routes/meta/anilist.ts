import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { META } from '@consumet/extensions';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const anilist = new META.Anilist();

  fastify.get('/anilist', (_, rp) => {
    rp.status(200).send({
      intro: 'Welcome to the anilist provider',
      routes: ['/:query', '/info/*', '/watch/*'], // 這裡也順便更新一下說明
      documentation: 'https://docs.consumet.org/#tag/anilist',
    });
  });

  // 1. 搜尋路由 (保持不變)
  fastify.get('/anilist/:query', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.params as { query: string }).query;
    const res = await anilist.search(query);
    reply.status(200).send(res);
  });

  // 2. 🌟 獲取詳情路由 (改成 *)
  fastify.get('/anilist/info/*', async (request: FastifyRequest, reply: FastifyReply) => {
    // 使用萬用字元獲取帶有斜線的 ID
    const id = decodeURIComponent((request.params as any)['*']);
    const isDub = (request.query as { dub?: boolean }).dub;

    try {
      const res = await anilist
        .fetchAnimeInfo(id, isDub)
        .catch((err) => reply.status(404).send({ message: err }));

      reply.status(200).send(res);
    } catch (err) {
      reply.status(500).send({ message: 'Something went wrong.' });
    }
  });

  // 3. 🌟 獲取播放連結路由 (改成 *)
  fastify.get(
    '/anilist/watch/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 使用萬用字元獲取帶有斜線的 Episode ID
      const episodeId = (request.params as any)['*'];

      try {
        const res = await anilist
          .fetchEpisodeSources(episodeId)
          .catch((err) => reply.status(404).send({ message: err }));

        reply.status(200).send(res);
      } catch (err) {
        reply.status(500).send({ message: 'Something went wrong.' });
      }
    },
  );
};

export default routes;
