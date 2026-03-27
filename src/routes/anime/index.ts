import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import { PROVIDERS_LIST } from '@consumet/extensions';

import gogoanime from './gogoanime';
import animepahe from './animepahe';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  await fastify.register(gogoanime, { prefix: '/' });
  await fastify.register(animepahe, { prefix: '/' });

  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send('Welcome to Consumet Anime 🗾');
  });

  fastify.get('/:animeProvider', async (request: FastifyRequest, reply: FastifyReply) => {
    const animeProvider = decodeURIComponent(
      (request.params as { animeProvider: string }).animeProvider,
    );
    // The 'page' query parameter was being parsed but not used.
    // If needed, it can be retrieved like this:
    // const page = Number((request.query as { page?: string }).page) || 1;

    const provider = PROVIDERS_LIST.ANIME.find(
      (p: any) => p.toString.name.toLowerCase() === animeProvider.toLowerCase(),
    );

    try {
      if (provider) {
        // Redirect to the provider's root info route, e.g., /anime/gogoanime or /anime/animepahe
        // Using the found provider's name ensures correct casing for the redirect path.
        reply.redirect(`/anime/${provider.toString.name.toLowerCase()}`);
      } else {
        reply
          .status(404)
          .send({ message: 'Provider not found, please check the providers list.' });
      }
    } catch (err) {
      reply.status(500).send('Something went wrong. Please try again later.');
    }
  });
};

export default routes;
