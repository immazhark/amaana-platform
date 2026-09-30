import { homepageImpact } from '@/content/amaana';
import { documentedAssistanceTotal } from '@/lib/documented-assistance';
import { formatINR } from '@/lib/appeals';

export function HomeHighlights() {
  const total = documentedAssistanceTotal();
  const highlights = [...homepageImpact, {
    value: total === null ? 'Documented cases' : formatINR(total),
    label: 'medical, livelihood & financial assistance across documented cases',
  }];
  return (
    <section className="v3-proof" aria-labelledby="homepage-highlights-title">
      <div className="v3-shell">
        <p className="v3-proof-label" id="homepage-highlights-title">Highlights</p>
        <div className="v3-proof-grid">
          {highlights.map(item => (
            <div className="v3-proof-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
