import { Hono } from 'hono';

const app = new Hono();

app.get('/test-env', (c) => {
  return c.json({
    process_env_db: process.env.DATABASE_URL ? 'exists' : 'missing',
    c_env_db: c.env.DATABASE_URL ? 'exists' : 'missing',
  });
});

export default app;
