import { describe, expect, it } from 'vitest';

const frontendOrigin = process.env.FRONTEND_URL;
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS;

describe('final production origin configuration', () => {
  it('uses the approved public frontend origin values', () => {
    expect(frontendOrigin).toBe('https://ygntv.org');
    expect(corsOrigins).toContain('https://ygntv.org');
  });

  it('receives a credentialed CORS response from the final public API', async () => {
    const response = await fetch('https://api.ygntv.org/api/movies?page=1', {
      headers: { Origin: frontendOrigin ?? '' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(frontendOrigin);
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
  }, 30_000);
});
