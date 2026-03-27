import { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';

// For Vercel serverless
const appPromise = createApp();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await appPromise;
    app.server.emit('request', req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

// Local dev: start Fastify server if run directly
if (require.main === module) {
  (async () => {
    const app = await createApp();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen({ port, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
      console.log(`🚀 Server listening at ${address}`);
    });
  })();
}
