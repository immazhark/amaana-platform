/** AF-R076: static source contract for native public email destinations. */
import ts from 'typescript';

const GENERAL = 'mailto:amaanafoundation24@gmail.com';
const DONATION = GENERAL + '?subject=Donation%20support';
const PROTECTED_LINK = /(?:\/cdn-cgi\/l\/email-protection|data-cfemail|__cf_email__)/i;

function staticHrefValues(source, path) {
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (ast.parseDiagnostics.length) throw new Error(`Unable to parse ${path} for link validation`);
  const found = [];
  let dynamic = 0;
  const visit = node => {
    if (ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
      && node.name.text === 'href' && ts.isStringLiteralLike(node.initializer)) {
      found.push(node.initializer.text);
    } else if (ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
      && node.name.text === 'href' && !ts.isStringLiteralLike(node.initializer)) {
      dynamic++;
    }
    if (ts.isJsxAttribute(node) && node.name.text === 'href') {
      if (node.initializer && ts.isStringLiteral(node.initializer)) found.push(node.initializer.text);
      else if (node.initializer && ts.isJsxExpression(node.initializer)
        && node.initializer.expression && ts.isStringLiteralLike(node.initializer.expression)) {
        found.push(node.initializer.expression.text);
      } else if (node.initializer && ts.isJsxExpression(node.initializer)
        && node.initializer.expression &&
        (ts.isTemplateExpression(node.initializer.expression) ||
         ts.isBinaryExpression(node.initializer.expression) ||
         ts.isCallExpression(node.initializer.expression))) {
        dynamic++;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return { found, dynamic };
}

export function auditContactEmailLinks(contactSource, footerSource) {
  const problems = [];
  for (const [name, source, minimum] of [['Contact', contactSource, 3], ['footer', footerSource, 1]]) {
    let hrefs;
    let dynamic;
    try { ({ found: hrefs, dynamic } = staticHrefValues(source, name)); }
    catch { problems.push(`${name} link source cannot be parsed`); continue; }
    if (dynamic) problems.push(`${name} dynamic href cannot be verified`);
    if (hrefs.some(href => PROTECTED_LINK.test(href))) problems.push(`${name} has an invalid Cloudflare email-protection link`);
    if (hrefs.some(href => /^javascript:/i.test(href.trimStart()))) problems.push(`${name} includes a javascript: link`);
    if (hrefs.some(href => href.startsWith('mailto:') && href !== GENERAL && href !== DONATION)) {
      problems.push(`${name} contains an unapproved mailto destination`);
    }
    if (hrefs.filter(href => href === GENERAL).length < minimum) {
      problems.push(`${name} is missing the required native public email links`);
    }
    if (name === 'Contact' && hrefs.filter(href => href === DONATION).length !== 1) {
      problems.push('Contact donation support mailto destination is missing or duplicated');
    }
  }
  return problems;
}
