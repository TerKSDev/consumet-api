import 'dotenv/config';
import { createApp } from '../src/app';

(async () => {
  const PORT = Number(process.env.PORT) || 3000;
  const fastify = await createApp(); // Get the configured Fastify instance

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    const address = fastify.server.address();
    console.log(
      `Server listening on ${typeof address === 'string' ? address : address?.port}`,
    );
  } catch (err: any) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
