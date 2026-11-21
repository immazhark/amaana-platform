import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

// AF-R069: each rule enabled for src/** must actually fire on a violating fixture,
// so a config change that silently disables one fails here.
const fixtures = {
  "anchor-has-content": '<a href="/x"></a>',
  "aria-role": '<div role="madeup" />',
  "autocomplete-valid": '<input type="text" autoComplete="nope" />',
  "heading-has-content": "<h2></h2>",
  "iframe-has-title": '<iframe src="/x" />',
  "img-redundant-alt": '<img src="/x.png" alt="image of a dog" />',
  "mouse-events-have-key-events": "<div onMouseOver={() => {}} />",
  "no-access-key": '<div accessKey="a" />',
  "no-aria-hidden-on-focusable": '<button aria-hidden="true">x</button>',
  "no-distracting-elements": "<marquee>x</marquee>",
  "no-redundant-roles": '<button role="button">x</button>',
  scope: '<div scope="col" />',
  "no-interactive-element-to-noninteractive-role": '<button role="article">x</button>',
  "no-noninteractive-element-to-interactive-role": '<h2 role="button">x</h2>',
  "anchor-ambiguous-text": '<a href="/x">click here</a>',
};

const eslint = new ESLint({ cwd: new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") });

for (const [rule, markup] of Object.entries(fixtures)) {
  test(`jsx-a11y/${rule} is enforced on src components`, async () => {
    const source = `export function Fixture() { return (${markup}); }\n`;
    const [result] = await eslint.lintText(source, { filePath: "src/components/__a11y_fixture__.tsx" });
    assert.ok(result.messages.some((message) => message.ruleId === `jsx-a11y/${rule}`), `${rule} did not fire`);
  });
}

test("a compliant fixture raises none of the enforced rules", async () => {
  const source = 'export function Fixture() { return (<section><h2>Title</h2><a href="/x">Read the annual report</a></section>); }\n';
  const [result] = await eslint.lintText(source, { filePath: "src/components/__a11y_fixture__.tsx" });
  assert.deepEqual(result.messages.filter((m) => (m.ruleId ?? "").startsWith("jsx-a11y")).map((m) => m.ruleId), []);
});
