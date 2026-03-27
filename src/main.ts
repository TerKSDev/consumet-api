import 'dotenv/config';

import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';

/*import books from './routes/books';*/
import anime from './routes/anime';
/*import manga from './routes/manga';
import comics from './routes/comics';
import lightnovels from './routes/light-novels';
import movies from './routes/movies';*/
import meta from './routes/meta';

(async () => {
  const PORT = Number(process.env.PORT) || 3000;
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

  try {
    fastify.get('/', (_, rp) => {
      rp.status(200).send('Welcome to consumet api! 🎉');
    });

    fastify.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        message: `Route ${request.method}:${request.url} not found.`,
        error: 'Page not found',
      });
    });

    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err: any) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
