import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const groups = [
  { paths: /^src\/components\/(site-header|site-footer|footer-nav-group|home-story-slide|home-highlights|home-evidence|work-portfolio|work-visual-placeholder|action-icon)(\.|\/)/, tests: ['site-chrome-footer.spec.mjs', 'owner-screenshot-polish.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/app\/(home[^/]*|our-work[^/]*)\.css$/, tests: ['site-chrome-footer.spec.mjs', 'owner-screenshot-polish.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/content\/.*\.json$/, tests: ['public-seo.spec.mjs', 'site-chrome-footer.spec.mjs'] },
  { paths: /^public\/(brand|backgrounds)\//, tests: ['background-system.spec.mjs', 'site-chrome-footer.spec.mjs', 'owner-screenshot-polish.spec.mjs'] },
  { paths: /^src\/app\/(about|contact|governance|transparency|compliance|recognition|partner)\/page\.tsx$/, tests: ['public-seo.spec.mjs', 'public-shell.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/components\/(body-carousel|body-card|scroll-carousel)(\.|\/)/, tests: ['body-carousel-new.spec.mjs', 'carousel-acceptance.spec.mjs', 'site-chrome-footer.spec.mjs'] },
  { paths: /^src\/components\/campaign-media-gallery(\.|\/)/, tests: ['campaign-gallery.spec.mjs'] },
];
export function planChanges(files, { event = 'pull_request', target = 'phase-public-site-rebuild', release = false, validatedMerge = false } = {}) {
  const docsOnly = files.length > 0 && files.every(p => /^(docs\/.*\.md|README\.md)$/.test(p));
  const fullRelease = release || target === 'main';
  const tests = new Set(['public-performance.spec.mjs']);
  let mapped = files.length > 0;
  for (const file of files) {
    if (/^(docs\/.*\.md|README\.md)$/.test(file)) continue;
    const group = groups.find(g => g.paths.test(file));
    if (!group) mapped = false;
    else for (const test of group.tests) tests.add(test);
  }
  // Unknown/shared/server/config changes fail closed to full coverage.
  let mode = docsOnly && !fullRelease ? 'none' : mapped && !fullRelease ? 'focused' : 'full';
  // Integration already had PR acceptance. Build/budgets/server smoke still run.
  if (event === 'push' && target === 'phase-public-site-rebuild' && !release && validatedMerge) mode = 'none';
  return { app: !docsOnly || fullRelease, database: fullRelease || (!docsOnly && !mapped), browser: mode !== 'none', mode,
    tests: mode === 'focused' ? [...tests].sort() : [],
    crossBrowser: mode === 'full', visual: fullRelease,
    reason: fullRelease ? 'Release checkpoint' : docsOnly ? 'Documentation only' : event === 'push' && validatedMerge ? 'Integration build and server smoke; PR browser validation retained' : mapped ? 'Explicit component dependency map' : 'Unknown or broad impact: full acceptance' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env;
  let files = [];
  try {
    if (!env.CI_BASE || /^0+$/.test(env.CI_BASE)) throw new Error('Missing base');
    files = execFileSync('git', ['diff', '--name-only', '-z', env.CI_BASE, 'HEAD'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  } catch { files = ['unknown-diff']; }
  let validatedMerge = false;
  if (env.CI_EVENT === 'push' && env.CI_TARGET === 'phase-public-site-rebuild') {
    try {
      const parents = execFileSync('git', ['rev-list', '--parents', '-n', '1', 'HEAD'], { encoding: 'utf8' }).trim().split(' ');
      if (parents.length === 3) {
        const headTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim();
        const taskTree = execFileSync('git', ['rev-parse', `${parents[2]}^{tree}`], { encoding: 'utf8' }).trim();
        if (headTree === taskTree) {
          const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs?head_sha=${parents[2]}&event=pull_request&per_page=100`, {
            headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000),
          });
          if (!response.ok) throw new Error('Cannot verify previous acceptance');
          const runs = (await response.json()).workflow_runs;
          // Latest CI result must pass; older successes do not override newer failures.
          const latest = runs.filter(run => run.path === '.github/workflows/ci.yml').sort((a, b) => b.id - a.id)[0];
          if (latest?.conclusion === 'success') {
            const jobsResponse = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${latest.id}/jobs?per_page=100`, {
              headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000),
            });
            if (!jobsResponse.ok) throw new Error('Cannot verify completed jobs');
            const jobs = (await jobsResponse.json()).jobs;
            // A ready transition intentionally skips application jobs; never use it as proof.
            validatedMerge = jobs.some(job => ['fast', 'verify'].includes(job.name) && job.conclusion === 'success')
              && !jobs.some(job => job.name === 'fast' && job.conclusion !== 'success');
          }
        }
      }
    } catch { validatedMerge = false; }
  }
  const plan = planChanges(files, { event: env.CI_EVENT, target: env.CI_TARGET, release: env.CI_RELEASE === 'true', validatedMerge });
  console.log(JSON.stringify({ files, ...plan }, null, 2));
  if (env.GITHUB_OUTPUT) for (const [key, value] of Object.entries(plan)) appendFileSync(env.GITHUB_OUTPUT, `${key}=${Array.isArray(value) ? value.join(' ') : value}\n`);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `## Verification plan\n${plan.reason}\n\nBrowser mode: **${plan.mode}**. Selected suites: ${plan.tests.join(', ') || plan.mode}.\n`);
}
