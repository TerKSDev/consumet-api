import { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';

// Initialize the Fastify app once
const appPromise = createApp();

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Wait for the app to be fully initialized.
    // On subsequent calls within the same container, this will resolve instantly.
    const app = await appPromise;

    // Let Fastify handle the request.
    app.server.emit('request', req, res);
  } catch (error) {
    // Log the error to Vercel logs for debugging
    console.error('Error in Vercel handler:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
