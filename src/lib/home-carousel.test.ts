import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_ARTWORK_SRC, composeHomeSlides, defaultHomeConfig, defaultHomeSlides, parseHomeConfig, safeHomeHref, validateHomeSlide, visibleHomeSlides } from './home-carousel';
const now = new Date('2026-10-03T18:00:00Z');
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
    const slide = validateHomeSlide({ ...defaultHomeSlides[0], startsAt: '2026-10-03T18:00', endsAt: '2026-10-03T19:00' });
    expect(slide.startsAt).toBe(now.toISOString());
    expect(visibleHomeSlides({slides:[slide],appealPosition:0},new Set(),now)).toHaveLength(1);
    expect(visibleHomeSlides({slides:[slide],appealPosition:0},new Set(),new Date(slide.endsAt))).toHaveLength(0);
  });
  it('keeps drafts, future, expired and closed-linked slides private', () => {
    const slides = [{...defaultHomeSlides[0],status:'DRAFT' as const}, {...defaultHomeSlides[1],startsAt:'2026-10-04T00:00:00Z'}, {...defaultHomeSlides[2],endsAt:now.toISOString()}, {...defaultHomeSlides[3],appealSlug:'closed'}];
    expect(visibleHomeSlides({slides,appealPosition:1},new Set(),now)).toEqual([]);
  });
  it('automatically inserts appeals and replaces them with linked custom slides without duplicates', () => {
    const appeal = {...defaultHomeSlides[0],id:'appeal-live',appealSlug:'live',image:'logo'};
    expect(composeHomeSlides(defaultHomeConfig,[appeal],now).map(s=>s.id)).toEqual(['origin','appeal-live','eid','medical','taleem','qurbani']);
    const config = {...defaultHomeConfig,slides:[...defaultHomeSlides,{...appeal,id:'custom',order:8}]};
    expect(composeHomeSlides(config,[appeal],now).filter(s=>s.appealSlug==='live').map(s=>s.id)).toEqual(['custom']);
    expect(composeHomeSlides(config,[],now).map(s=>s.id)).toEqual(defaultHomeSlides.map(s=>s.id));
  });
  it('rejects duplicate identifiers, invalid date windows and unreviewable image addresses', () => {
    expect(()=>parseHomeConfig({...defaultHomeConfig,slides:[defaultHomeSlides[0],defaultHomeSlides[0]]})).toThrow(/unique/);
    expect(()=>validateHomeSlide({...defaultHomeSlides[0],startsAt:'2026-10-04T00:00Z',endsAt:'2026-10-03T00:00Z'})).toThrow(/follow/);
    expect(()=>validateHomeSlide({...defaultHomeSlides[0],image:'https://arbitrary.invalid/photo'})).toThrow(/approved/);
  });
  it.each(['javascript:alert(1)','//evil.invalid','/admin','/api/private','/x/../admin','/%2f%2fevil.invalid','/about%0a','/about\\admin','/%61dmin','/%2561dmin'])('rejects unsafe CTA %s', href => expect(()=>safeHomeHref(href)).toThrow());
});
