import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { ANIME } from '@consumet/extensions';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const animepahe = new ANIME.AnimePahe();

  fastify.get('/animepahe', (_, rp) => {
    rp.status(200).send({
      intro:
        "Welcome to the animepahe provider: check out the provider's website @ https://animepahe.com/",
      routes: ['/:query', '/info/:id', '/watch/:episodeId'],
      documentation: 'https://docs.consumet.org/#tag/animepahe',
    });
  });

  fastify.get(
    '/animepahe/:query',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { query } = request.params as { query: string };
      try {
        const res = await animepahe.search(query);
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(err, `AnimePahe search failed for query: ${query}`);
        reply.status(500).send({ message: 'Something went wrong', error: err.message });
      }
    },
  );

  fastify.get(
    '/animepahe/info/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const id = (request.params as any)['*'];
      const episodePage = Number((request.query as { episodePage?: string }).episodePage);

      try {
        const res = await animepahe.fetchAnimeInfo(
          id,
          !isNaN(episodePage) ? episodePage : undefined,
        );
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(err, `AnimePahe info fetch failed for id: ${id}`);
        reply
          .status(404)
          .send({ message: `Anime info not found for id: ${id}`, error: err.message });
      }
    },
  );

  fastify.get(
    '/animepahe/watch/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const episodeId = (request.params as any)['*'];

      try {
        const res = await animepahe.fetchEpisodeSources(episodeId);
        reply.status(200).send(res);
      } catch (err: any) {
        fastify.log.error(
          err,
          `AnimePahe watch fetch failed for episodeId: ${episodeId}`,
        );
        reply.status(404).send({
          message: `Sources not found for episodeId: ${episodeId}`,
          error: err.message,
        });
      }
    },
  );
};

export default routes;
