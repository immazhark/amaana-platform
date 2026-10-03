import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const groups = [
  // Typography-only CSS: rendered six-width heading/focus/overflow coverage; JSX retains shell/journey dependencies.
  { paths: /^src\/components\/section-heading\.module\.css$/, tests: ['section-heading.spec.mjs', 'typography-hierarchy.spec.mjs', 'ui-consistency.spec.mjs', 'owner-nine-surfaces.spec.mjs'] },
  // Owner surface routes and removal of TSX-unreferenced legacy hero selectors.
  { paths: /^(e2e\/owner-nine-surfaces\.spec\.mjs|src\/app\/(?:faith(?:-wow)?|stories(?:-wow)?|trust-experience)\.css|src\/app\/(?:faith-and-reflections|stories|partner|compliance)\/(?:page\.tsx|[^/]+\.module\.css))$/, tests: ['owner-nine-surfaces.spec.mjs', 'owner-surface-polish.spec.mjs', 'section-heading.spec.mjs', 'public-seo.spec.mjs', 'ui-consistency.spec.mjs', 'typography-hierarchy.spec.mjs', 'background-system.spec.mjs'] },
  { paths: /^(src\/app\/(page\.tsx|home-documentary\.css|browser-acceptance\/home-hero\/page\.tsx)|src\/components\/home-story-slide\.tsx|e2e\/home-banner-composition\.spec\.mjs)$/, tests: ['home-banner-composition.spec.mjs', 'owner-screenshot-polish.spec.mjs', 'typography-hierarchy.spec.mjs', 'public-seo.spec.mjs', 'ui-consistency.spec.mjs'] },
  { paths: /^(e2e\/owner-surface-polish\.spec\.mjs|src\/components\/trust-evidence-boundary\.module\.css|src\/app\/(?:refund-policy|privacy)\/(?:page\.tsx|[^/]+\.module\.css)|src\/app\/compliance\/compliance-audit\.module\.css)$/, tests: ['owner-surface-polish.spec.mjs', 'policy-navigation.spec.mjs', 'ui-consistency.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^(src\/app\/donate\/(page\.tsx|donate-audit\.module\.css)|src\/app\/get-involved\/sponsor-education\/sponsor-education\.css|e2e\/donate-sponsorship-layout\.spec\.mjs)$/, tests: ['donate-sponsorship-layout.spec.mjs', 'donation-assistance-journeys.spec.mjs', 'participation-contact.spec.mjs', 'public-seo.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^(src\/components\/islamic-companion(?:-panel)?(?:\.tsx|\.module\.css)|e2e\/companion-panel\.spec\.mjs)$/, tests: ['companion-panel.spec.mjs', 'navigation-resilience.spec.mjs', 'site-chrome-footer.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^(src\/components\/site-header(?:\.tsx|\.module\.css)|e2e\/navigation-resilience\.spec\.mjs)$/, tests: ['navigation-resilience.spec.mjs', 'site-chrome-footer.spec.mjs', 'typography-hierarchy.spec.mjs', 'page-banner-standardization.spec.mjs'] },
  // Specific page families precede broad page mappings: no whole-site matrix for scoped presentation.
  { paths: /^(src\/app\/policy-experience\.css|src\/components\/policy-toc(?:\.tsx|\.module\.css)|e2e\/policy-navigation\.spec\.mjs)$/, tests: ['owner-surface-polish.spec.mjs', 'policy-navigation.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^(src\/app\/request-assistance\/(page\.tsx|assistance-surface\.module\.css)|src\/app\/assistance-wow\.css|src\/components\/assistance-form\.module\.css|e2e\/assistance-surface\.spec\.mjs)$/, tests: ['assistance-surface.spec.mjs', 'donation-assistance-journeys.spec.mjs', 'page-banner-standardization.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/app\/(get-involved|contact|appeals)\/(page\.tsx|[^/]+\.module\.css)$/, tests: ['ui-consistency.spec.mjs', 'participation-contact.spec.mjs', 'public-seo.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/components\/(evidence-pathway\.module\.css|trust-evidence-boundary\.tsx)$/, tests: ['ui-consistency.spec.mjs', 'section-heading.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/app\/faith-and-reflections\/page\.tsx$/, tests: ['ui-consistency.spec.mjs', 'section-heading.spec.mjs', 'public-seo.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/app\/(impact|our-work)\/page\.tsx$/, tests: ['ui-consistency.spec.mjs', 'section-heading.spec.mjs', 'public-seo.spec.mjs', 'initiative-detail.spec.mjs', 'carousel-acceptance.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/app\/state-experience\.css$/, tests: ['ui-consistency.spec.mjs', 'page-banner-standardization.spec.mjs', 'donation-assistance-journeys.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/app\/home-experience\.css$/, tests: ['ui-consistency.spec.mjs', 'participation-contact.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^e2e\/(ui-consistency|body-carousel-new)\.spec\.mjs$/, tests: ['ui-consistency.spec.mjs', 'body-carousel-new.spec.mjs'] },
  // Public heading/layout presentation only; APIs, auth, database and unknown paths remain full.
  { paths: /^src\/components\/(section-heading|canonical-article|programme-detail|trust-evidence-boundary|home-evidence)(\.|\/)/, tests: ['section-heading.spec.mjs', 'initiative-detail.spec.mjs', 'public-shell.spec.mjs', 'typography-hierarchy.spec.mjs', 'site-chrome-footer.spec.mjs', 'campaign-gallery.spec.mjs'] },
  { paths: /^src\/app\/(site-chrome|canonical-content)\.css$/, tests: ['owner-surface-polish.spec.mjs', 'section-heading.spec.mjs', 'site-chrome-footer.spec.mjs', 'public-shell.spec.mjs', 'typography-hierarchy.spec.mjs', 'owner-screenshot-polish.spec.mjs'] },
  { paths: /^src\/app\/(page\.tsx|(?:our-work|appeals|stories|faith-and-reflections|get-involved|contact|compliance|impact|request-assistance)(?:\/\[slug\]|\/sponsor-education)?\/page\.tsx)$/, tests: ['section-heading.spec.mjs', 'public-shell.spec.mjs', 'public-seo.spec.mjs', 'typography-hierarchy.spec.mjs', 'participation-contact.spec.mjs', 'initiative-detail.spec.mjs', 'carousel-acceptance.spec.mjs'] },
  { paths: /^e2e\/owner-screenshot-polish\.spec\.mjs$/, tests: ['owner-screenshot-polish.spec.mjs'] },
  { paths: /^e2e\/section-heading\.spec\.mjs$/, tests: ['section-heading.spec.mjs'] },
  { paths: /^src\/components\/(participation-card|social-icon)(\.|\/)/, tests: ['participation-contact.spec.mjs', 'site-chrome-footer.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/components\/work-visual-placeholder\.module\.css$/, tests: ['participation-contact.spec.mjs', 'background-system.spec.mjs', 'owner-screenshot-polish.spec.mjs'] },
  { paths: /^e2e\/(participation-contact|visual-system)\.spec\.mjs$/, tests: ['participation-contact.spec.mjs', 'visual-system.spec.mjs'] },
  // Planner-only changes run their mandatory Node regression suite in plan;
  // workflow, auth, database and unknown paths still select full acceptance.
  { paths: /^scripts\/(ci-plan|test-ci-plan)\.mjs$/, tests: [] },
  { paths: /^src\/components\/(site-header|site-footer|footer-nav-group|home-story-slide|home-highlights|home-evidence|work-portfolio|work-visual-placeholder|action-icon)(\.|\/)/, tests: ['site-chrome-footer.spec.mjs', 'owner-screenshot-polish.spec.mjs', 'typography-hierarchy.spec.mjs'] },
  { paths: /^src\/app\/(home[^/]*|our-work[^/]*)\.css$/, tests: ['site-chrome-footer.spec.mjs', 'owner-screenshot-polish.spec.mjs', 'typography-hierarchy.spec.mjs', 'ui-consistency.spec.mjs'] },
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
