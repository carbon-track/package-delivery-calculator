import { describe, it, expect, vi } from 'vitest';
import worker, { type Env } from '../worker';
import { DraftResponseSchema, DraftRequestSchema } from '../src/features/ai/schemas';
import { calculatePackage } from '../src/calculator';
import { demoPackage, dataset } from '../src/data/demo/package';
const request = (path: string, body: unknown) =>
  new Request(`https://package.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://package.test' },
    body: JSON.stringify(body),
  });
const env = (): Env => ({
  ASSETS: { fetch: vi.fn(async () => new Response('asset')) },
  AI_ENABLED: 'false',
});
const valid = {
  components: [
    {
      type: 'shipping_box',
      material: 'corrugated_cardboard',
      quantity: 1,
      confidence: 0.8,
      inferredFrom: 'text',
    },
  ],
  draftWarnings: ['请核对材料'],
  unknownFields: ['massGrams', 'route'],
};
describe('AI validation and graceful failure', () => {
  it('rejects emissions, guessed mass and unknown extra keys in AI output', () => {
    expect(DraftResponseSchema.safeParse(valid).success).toBe(true);
    expect(DraftResponseSchema.safeParse({ ...valid, emissions: 0.4 }).success).toBe(false);
    expect(
      DraftResponseSchema.safeParse({
        ...valid,
        components: [{ ...valid.components[0], massGrams: 100 }],
      }).success,
    ).toBe(false);
    expect(
      DraftResponseSchema.safeParse({
        ...valid,
        components: [{ ...valid.components[0], quantity: 0 }],
      }).success,
    ).toBe(false);
  });
  it('requires an input and supported image format', () => {
    expect(DraftRequestSchema.safeParse({}).success).toBe(false);
    expect(DraftRequestSchema.safeParse({ text: '  ' }).success).toBe(false);
    expect(DraftRequestSchema.safeParse({ imageBase64: 'https://evil.test/image' }).success).toBe(
      false,
    );
  });
  it('returns an actionable 503 if optional AI is disabled', async () => {
    const response = await worker.fetch(request('/api/ai/package-draft', { text: 'a box' }), env());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
  it('returns deterministic explanation without an AI binding', async () => {
    const response = await worker.fetch(
      request('/api/ai/explain-result', { baselineResult: calculatePackage(demoPackage, dataset) }),
      env(),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ fallback: true });
  });
  it('rejects cross-origin writes, malformed JSON and invalid requests', async () => {
    expect(
      (
        await worker.fetch(
          new Request('https://package.test/api/ai/package-draft', {
            method: 'POST',
            headers: { Origin: 'https://evil.test' },
          }),
          env(),
        )
      ).status,
    ).toBe(403);
    expect((await worker.fetch(request('/api/ai/package-draft', {}), env())).status).toBe(400);
    expect(
      (
        await worker.fetch(
          new Request('https://package.test/api/ai/package-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{',
          }),
          env(),
        )
      ).status,
    ).toBe(400);
  });
  it('refuses oversized payloads and unsupported content types', async () => {
    expect(
      (
        await worker.fetch(
          new Request('https://package.test/api/ai/package-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': '4000000' },
            body: '{}',
          }),
          env(),
        )
      ).status,
    ).toBe(413);
    expect(
      (
        await worker.fetch(
          new Request('https://package.test/api/ai/package-draft', {
            method: 'POST',
            body: 'text',
          }),
          env(),
        )
      ).status,
    ).toBe(415);
  });
  it('fails closed unless a rate limiting binding is present', async () => {
    const e = env();
    e.AI_ENABLED = 'true';
    e.AI = { run: vi.fn() };
    expect((await worker.fetch(request('/api/ai/package-draft', { text: 'box' }), e)).status).toBe(
      503,
    );
    expect(e.AI.run).not.toHaveBeenCalled();
  });
  it('rejects invalid model JSON, validates good output and honors rate limits', async () => {
    const e = env();
    e.AI_ENABLED = 'true';
    e.AI = { run: vi.fn().mockResolvedValue({ response: 'not-json' }) };
    e.AI_RATE_LIMITER = { limit: vi.fn().mockResolvedValue({ success: true }) };
    expect((await worker.fetch(request('/api/ai/package-draft', { text: 'box' }), e)).status).toBe(
      502,
    );
    vi.mocked(e.AI.run).mockResolvedValue({ response: JSON.stringify(valid) });
    expect(
      await (await worker.fetch(request('/api/ai/package-draft', { text: 'box' }), e)).json(),
    ).toEqual(valid);
    vi.mocked(e.AI_RATE_LIMITER.limit).mockResolvedValue({ success: false });
    expect((await worker.fetch(request('/api/ai/package-draft', { text: 'box' }), e)).status).toBe(
      429,
    );
  });
  it('rejects newly generated numerical explanations', async () => {
    const e = env();
    e.AI_ENABLED = 'true';
    e.AI = {
      run: vi.fn().mockResolvedValue({
        response: JSON.stringify({ summary: '将减排 99%', suggestionCards: [], caveats: [] }),
      }),
    };
    e.AI_RATE_LIMITER = { limit: vi.fn().mockResolvedValue({ success: true }) };
    const r = await worker.fetch(
      request('/api/ai/explain-result', { baselineResult: calculatePackage(demoPackage, dataset) }),
      e,
    );
    expect(await r.json()).toMatchObject({ fallback: true });
  });
  it('serves static assets and returns JSON for missing APIs', async () => {
    const e = env();
    expect(await (await worker.fetch(new Request('https://package.test/'), e)).text()).toBe(
      'asset',
    );
    expect((await worker.fetch(new Request('https://package.test/api/missing'), e)).status).toBe(
      404,
    );
    expect(
      (await worker.fetch(new Request('https://package.test/api/ai/package-draft'), e)).status,
    ).toBe(405);
  });
});
