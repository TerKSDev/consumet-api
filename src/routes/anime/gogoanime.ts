import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { ANIME } from '@consumet/extensions';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  // 這裡改用 Hianime，因為 Gogoanime 已經從套件中被移除了
  const provider = new ANIME.AnimePahe();

  fastify.get('/gogoanime', (_, rp) => {
    rp.status(200).send({
      message: 'Hianime provider is active (Redirected from Gogoanime route)',
      routes: ['/:query', '/info/:id', '/watch/:episodeId'],
    });
  });

  // 搜索動漫
  fastify.get(
    '/gogoanime/:query',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { query } = request.params as { query: string };
      console.log(`Searching for ${query}`);

      try {
        const res = await provider.search(query);
        console.log('Search Result: ', res);
        reply.status(200).send(res);
      } catch (err: any) {
        console.error('Search Error: ', err);
        reply.status(500).send({ error: err.message });
      }
    },
  );

  // 獲取詳情
  fastify.get(
    '/gogoanime/info/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      try {
        const res = await provider.fetchAnimeInfo(id);
        reply.status(200).send(res);
      } catch (err: any) {
        reply.status(404).send({ message: 'Anime info not found' });
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
        reply.status(404).send({ message: 'Sources not found' });
      }
    },
  );
};

export default routes;
