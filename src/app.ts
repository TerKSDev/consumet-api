import 'dotenv/config';
import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';

import anime from './routes/anime';
/*import manga from './routes/manga';
import comics from './routes/comics';
import lightnovels from './routes/light-novels';
import movies from './routes/movies';*/
import meta from './routes/meta';

export const createApp = async () => {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(FastifyCors, {
    origin: '*',
    methods: 'GET',
  });

  /*await fastify.register(books, { prefix: '/books' });*/
  await fastify.register(anime, { prefix: '/anime' });
  /*await fastify.register(manga, { prefix: '/manga' });
  await fastify.register(comics, { prefix: '/comics' });
  await fastify.register(lightnovels, { prefix: '/light-novels' });
  await fastify.register(movies, { prefix: '/movies' });*/
  await fastify.register(meta, { prefix: '/meta' });

  fastify.get('/', (_, rp) => {
    rp.status(200).send('Welcome to consumet api on Vercel! 🎉');
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      message: `Route ${request.method}:${request.url} not found.`,
      error: 'Page not found',
    });
  });

  await fastify.ready();
  return fastify;
};
