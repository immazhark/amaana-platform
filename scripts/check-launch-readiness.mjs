import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GATE_STATUSES = new Set(['VERIFIED', 'PENDING', 'BLOCKED', 'NOT_APPLICABLE']);
export const GATE_TARGETS = new Set(['rehearsal', 'production']);

export function validateLaunchReadinessRegister(register) {
  if (register?.version !== 1) throw new Error('Launch readiness register must use version 1.');
  if (!Array.isArray(register.gates) || register.gates.length === 0) throw new Error('Launch readiness register requires gates.');

  const ids = new Set();
  for (const gate of register.gates) {
    if (!gate.id || ids.has(gate.id)) throw new Error(`Launch gate needs a unique id: ${JSON.stringify(gate.id)}.`);
    ids.add(gate.id);
    if (!GATE_STATUSES.has(gate.status)) throw new Error(`${gate.id} has unsupported status ${JSON.stringify(gate.status)}.`);
    if (!Array.isArray(gate.requiredFor) || gate.requiredFor.length === 0) throw new Error(`${gate.id} must declare requiredFor.`);
    for (const target of gate.requiredFor) if (!GATE_TARGETS.has(target)) throw new Error(`${gate.id} has unsupported target ${target}.`);
    if (!gate.evidence || String(gate.evidence).trim().length < 12) throw new Error(`${gate.id} needs meaningful evidence/context.`);

    if (gate.status === 'VERIFIED' && !gate.verifiedAt) throw new Error(`${gate.id} is VERIFIED without verifiedAt.`);
    if (gate.status !== 'VERIFIED' && gate.verifiedAt) throw new Error(`${gate.id} must not carry verifiedAt while status=${gate.status}.`);
    if (gate.status === 'NOT_APPLICABLE' && !gate.notApplicableReason) throw new Error(`${gate.id} needs notApplicableReason.`);
  }
  return register.gates;
}

export function readinessSummary(gates, target) {
  if (!GATE_TARGETS.has(target)) throw new Error(`Unsupported readiness target ${target}.`);
  const required = gates.filter(gate => gate.requiredFor.includes(target));
  const ready = required.filter(gate => ['VERIFIED', 'NOT_APPLICABLE'].includes(gate.status));
  const unresolved = required.filter(gate => !['VERIFIED', 'NOT_APPLICABLE'].includes(gate.status));
  return { target, required, ready, unresolved };
}

export async function loadLaunchReadinessRegister(registerPath = 'docs/launch-readiness.json') {
  const register = JSON.parse(await readFile(registerPath, 'utf8'));
  const gates = validateLaunchReadinessRegister(register);
  return { register, gates };
}

function printSummary(summary) {
  console.log(`${summary.target} readiness: ${summary.ready.length}/${summary.required.length} required gates resolved.`);
  if (summary.unresolved.length) {
    console.log('Unresolved gates:');
    for (const gate of summary.unresolved) console.log(`- ${gate.id}: ${gate.status} — ${gate.evidence}`);
  } else {
    console.log(`All ${summary.target} readiness gates are resolved.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv.includes('--production') ? 'production' : process.argv.includes('--rehearsal') ? 'rehearsal' : null;
  loadLaunchReadinessRegister().then(({ gates }) => {
    if (!target) {
      console.log(`Launch readiness register is structurally valid with ${gates.length} gates.`);
      console.log('Use --rehearsal or --production for a fail-closed readiness decision.');
      return;
    }
    const summary = readinessSummary(gates, target);
    printSummary(summary);
    if (summary.unresolved.length) throw new Error(`${target} readiness is blocked by ${summary.unresolved.length} unresolved gate(s).`);
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
