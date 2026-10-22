import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HomeCarouselValidationError, HOME_ARTWORK_SRC, composeHomeSlides, defaultHomeConfig, defaultHomeSlides, parseHomeConfig, safeHomeHref, validateHomeSlide, visibleHomeSlides } from './home-carousel';
const now = new Date('2026-10-03T18:00:00Z');
const origin = defaultHomeSlides[0];
const eid = defaultHomeSlides[1];
const medical = defaultHomeSlides[2];
const taleem = defaultHomeSlides[3];
if (!origin || !eid || !medical || !taleem) {
  throw new Error('Expected the four canonical homepage carousel fixtures used by these tests.');
}
describe('homepage carousel publication and schedules', () => {
  it('seeds five programme-level slides in the requested order', () => {
    expect(parseHomeConfig(defaultHomeConfig).slides.map(s => s.id)).toEqual(['origin','eid','medical','taleem','qurbani']);
    expect(defaultHomeSlides.every(s => !/20\d\d/.test(s.title + s.eyebrow))).toBe(true);
  });
  it('keeps every built-in artwork fallback backed by a committed public asset', () => {
    for (const src of Object.values(HOME_ARTWORK_SRC)) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', src.slice(1))), src).toBe(true);
    }
  });
  it('uses UTC for editor dates and applies inclusive start/exclusive end', () => {
    const slide = validateHomeSlide({ ...origin, startsAt: '2026-10-03T18:00', endsAt: '2026-10-03T19:00' });
    expect(slide.startsAt).toBe(now.toISOString());
    expect(visibleHomeSlides({slides:[slide],appealPosition:0},new Set(),now)).toHaveLength(1);
    expect(visibleHomeSlides({slides:[slide],appealPosition:0},new Set(),new Date(slide.endsAt))).toHaveLength(0);
  });
  it('keeps drafts, future, expired and closed-linked slides private', () => {
    const slides = [{...origin,status:'DRAFT' as const}, {...eid,startsAt:'2026-10-04T00:00:00Z'}, {...medical,endsAt:now.toISOString()}, {...taleem,appealSlug:'closed'}];
    expect(visibleHomeSlides({slides,appealPosition:1},new Set(),now)).toEqual([]);
  });
  it('automatically inserts appeals and replaces them with linked custom slides without duplicates', () => {
    const appeal = {...origin,id:'appeal-live',appealSlug:'live',image:'logo'};
    expect(composeHomeSlides(defaultHomeConfig,[appeal],now).map(s=>s.id)).toEqual(['origin','appeal-live','eid','medical','taleem','qurbani']);
    const config = {...defaultHomeConfig,slides:[...defaultHomeSlides,{...appeal,id:'custom',order:8}]};
    expect(composeHomeSlides(config,[appeal],now).filter(s=>s.appealSlug==='live').map(s=>s.id)).toEqual(['custom']);
    expect(composeHomeSlides(config,[],now).map(s=>s.id)).toEqual(defaultHomeSlides.map(s=>s.id));
  });
  it('withholds stored slides with unsafe primary or secondary destinations without hiding valid slides', () => {
    const slides = [origin, { ...eid, primaryHref: '/request-assistance/status' }, { ...medical, secondaryHref: '/donations/receipt' }];
    expect(composeHomeSlides({ slides, appealPosition: 1 }, [], now).map(s => s.id)).toEqual(['origin']);
    expect(composeHomeSlides({ slides: slides.slice(1), appealPosition: 1 }, [], now)).toEqual([origin]);
  });
  it('chooses the first visible custom slide per appeal and retains scheduled alternatives', () => {
    const appeal = { ...origin, id: 'appeal-live', appealSlug: 'live' };
    const earlier = { ...appeal, id: 'custom-a', order: 1 };
    const later = { ...appeal, id: 'custom-b', order: 2 };
    const config = { slides: [origin, later, earlier], appealPosition: 1 };
    expect(composeHomeSlides(config, [appeal, appeal], now).filter(s => s.appealSlug)).toEqual([earlier]);
    expect(composeHomeSlides({ ...config, slides: [origin, later, { ...earlier, endsAt: now.toISOString() }] }, [appeal], now).filter(s => s.appealSlug)).toEqual([later]);
    expect(composeHomeSlides(defaultHomeConfig, [appeal, appeal], now).filter(s => s.appealSlug)).toEqual([appeal]);
  });
  it.each([
    ['2026-10-22T12:00:00z', '2026-10-22T12:00:00.000Z'],
    ['2026-10-22T12:00:00+0530', '2026-10-22T06:30:00.000Z'],
    ['2026-10-22T12:00:00+05:30', '2026-10-22T06:30:00.000Z'],
  ])('normalizes supported schedule %s without leaking a RangeError', (startsAt, expected) => {
    expect(validateHomeSlide({ ...origin, startsAt }).startsAt).toBe(expected);
  });
  it.each(['2026-02-30T12:00', '2026-10-22T24:00', '2026-10-22T12:00:00+2500', '2026-10-22T12:60'])('rejects invalid schedule %s with field feedback', startsAt => {
    expect(() => validateHomeSlide({ ...origin, startsAt })).toThrow(HomeCarouselValidationError);
  });
  it('rejects duplicate identifiers, invalid date windows and unreviewable image addresses', () => {
    expect(()=>parseHomeConfig({...defaultHomeConfig,slides:[origin,origin]})).toThrow(/unique/);
    expect(()=>validateHomeSlide({...origin,startsAt:'2026-10-04T00:00Z',endsAt:'2026-10-03T00:00Z'})).toThrow(/follow/);
    expect(()=>validateHomeSlide({...origin,image:'https://arbitrary.invalid/photo'})).toThrow(/approved/);
  });
  it.each([
    '/donations',
    '/donations/receipt',
    '/request-assistance/status',
    '/request-assistance/received',
    '/request-assistance/status?reference=ABC123',
    '/%72equest-assistance/status',
    '/request-assistance/%73tatus',
    '/request-assistance/../donations',
    '/donations?reference=ABC123',
    '/donations%3Freference=ABC123',
    '/donations%23private',
    '/request-assistance/status%3Freference=ABC123',
    '/request-assistance/status%23private',
    '/admin%3Fprivate',
    '/api%23private',
  ])('rejects private transactional or assistance CTA %s', href => {
    expect(() => safeHomeHref(href)).toThrow(HomeCarouselValidationError);
  });
  it.each([
    '/about',
    '/our-work',
    '/request-assistance',
    '/donate',
    '/donate/reviewed-appeal',
    '/get-involved/sponsor-education',
  ])('retains intentional public and fundraising CTA %s', href => {
    expect(safeHomeHref(href)).toBe(href);
  });
  it.each(['javascript:alert(1)','//evil.invalid','/admin','/api/private','/x/../admin','/%2f%2fevil.invalid','/about%0a','/about\\admin','/%61dmin','/%2561dmin'])('rejects unsafe CTA %s', href => expect(()=>safeHomeHref(href)).toThrow());
});

describe('homepage editor scalar validation', () => {
  const invalidNumbers = [null, undefined, '', '   ', false, true, [], [0], {}];
  for (const field of ['order', 'focalX', 'focalY'] as const) {
    it.each(invalidNumbers.map((value, index) => [index, value] as const))(`rejects ambiguous ${field} input #%s`, (_index, value) => {
      expect(() => validateHomeSlide({ ...origin, [field]: value })).toThrow(HomeCarouselValidationError);
    });
  }

  it.each(invalidNumbers.map((value, index) => [index, value] as const))('rejects ambiguous appeal placement #%s', (_index, value) => {
    expect(() => parseHomeConfig({ ...defaultHomeConfig, appealPosition: value })).toThrow(HomeCarouselValidationError);
  });

  it('accepts ordinary numeric form strings and preserves configured zeroes', () => {
    const slide = validateHomeSlide({ ...origin, order: '0', focalX: '0', focalY: '100' });
    expect([slide.order, slide.focalX, slide.focalY]).toEqual([0, 0, 100]);
    expect(parseHomeConfig({ ...defaultHomeConfig, appealPosition: '0' }).appealPosition).toBe(0);
  });

  it.each(['/about%', '/about%2', '/about%GG'])('returns field validation feedback for malformed link %s', href => {
    expect(() => safeHomeHref(href)).toThrow(HomeCarouselValidationError);
  });

  it('treats a cleared secondary label consistently after trimming', () => {
    const slide = validateHomeSlide({ ...origin, secondaryLabel: '   ', secondaryHref: '' });
    expect(slide.secondaryLabel).toBe('');
    expect(slide.secondaryHref).toBe('');
  });
});
