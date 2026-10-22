import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { defaultHomeConfig } from '@/lib/home-carousel';

const mocks = vi.hoisted(() => ({ config: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requirePermission: async () => ({ id: 'editor' }), hasPermission: () => true }));
vi.mock('@/lib/home-carousel-data', () => ({ getHomeCarouselConfig: mocks.config }));
vi.mock('@/lib/prisma', () => ({ prisma: { mediaAsset: { findMany: async () => [] } } }));
vi.mock('./actions', () => ({ saveHomeCarousel: vi.fn() }));
import HomeCarouselEditor from './page';

it('identifies a withheld legacy slide and preserves its destination as editable text', async () => {
  const config = structuredClone(defaultHomeConfig);
  config.slides[0]!.primaryHref = '/request-assistance/status';
  mocks.config.mockResolvedValueOnce({ config, revision: 7 });
  const html = renderToStaticMarkup(await HomeCarouselEditor({ searchParams: Promise.resolve({}) }));
  expect(html).toContain('Withheld · Fix destinations');
  expect(html).toContain('This slide is hidden from the homepage.');
  expect(html).toContain('value="/request-assistance/status"');
  expect(html).not.toContain('href="/request-assistance/status"');
  expect(html).toContain('name="revision" value="7"');
});
