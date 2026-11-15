# Amaana Foundation — current source and release state

**Checkpoint: 16 November 2026 IST.** Sole implementation writer: `CHATGPT_ACTIVE`. GitHub source, Railway deployment and live website are different acceptance boundaries.

| Boundary | Independently verified state |
|---|---|
| Protected main source | `fde49ad9953a786422c8b56b5bada688f73c3ca2`, after SHA-guarded merges #994, #996, #992 and #997 |
| #994 Stylelint scope | merged `b97e93bdaa986409593b70e07acf4e77dbfb18a0`; full CI `43763379619`; ready CI `43766760511` |
| #996 keyboard-focus lint | merged `c481cdf7a2a3de429682c635a595c2ec8816e6c1`; full CI `43765135091`; ready CI `43767767508` |
| #992 report-label fix | merged `16cb7008e9beb976e813f1c30f3fe55fea9827c8`; full CI `43765279157`; ready CI `43767886938` |
| #997 sixth cleanup wave | merged `fde49ad9953a786422c8b56b5bada688f73c3ca2`; full CI `43765639843`; ready CI `43767990401`; 25/25 historical refs RETIRED and absent, plus merged task branch absent |
| Previous #991 cleanup | 20 historical refs RETIRED and verified absent, plus merged task branch absent |
| Railway website deployment | SUCCESS at `c481cdf7a2a3de429682c635a595c2ec8816e6c1` |
| Independent public runtime | `/api/health/version` returned `c481cdf7a2a3de429682c635a595c2ec8816e6c1`, branch main, environment production; `/api/health/ready` returned `ready` |
| Later Railway watches | website and worker SKIPPED for #992 and #997, correct out-of-watch behavior |
| Open work | seventh guarded retirement batch `chore/af-r079-reviewed-history-wave7-20261116`; source PRs #993/#995 awaiting current-head acceptance; finance drafts #684/#845 HELD |
| Original 149-item classifications | 35 Completed / 24 Implemented / 71 Partial / 17 Not started / 1 Superseded / 1 N/A |

**Material limits:** protected merges do not by themselves certify payments, private admin journeys, field Core Web Vitals, assistive technology, historical media privacy or donor/legal claims. No FCRA registration; domestic INR only; 12A/12AB provisional and 80G status conflict remain under qualified review. No live payment/refund, donor communication, notification activation, infrastructure apply or forced production rollout.

**Next:** full CI plus separate ready-state and SHA-guarded merge for the seventh exact-head retirement batch; verify deletions one by one. Reconcile #993/#995 without force-push and complete their protected release acceptance. See [active work](./AI_ACTIVE_WORK.md), [retention manifest](./mission-control/af-r079-approved-retirement-batch-20261115.json) and [handoff ledger](./AI_HANDOFF_LEDGER.md).
