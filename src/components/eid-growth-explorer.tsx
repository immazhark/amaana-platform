import { eidGrowth } from "@/content/amaana";
import { buildEidGrowthMilestones } from "@/lib/eid-growth-milestones";

const milestones = buildEidGrowthMilestones(eidGrowth);
const totalDistributions = milestones.at(-1)?.cumulativeDistributions ?? 0;

function readableNumber(value: number) {
  return value.toLocaleString("en-IN");
}

/**
 * Progressive-enhancement first: details/summary supplies keyboard, touch
 * and assistive technology interaction without hydration or custom scripting.
 */
export function EidGrowthExplorer() {
  return (
    <figure className="v3-eid-explorer" aria-labelledby="eid-explorer-caption">
      <figcaption id="eid-explorer-caption">
        Explore the year-by-year record. Select any year to see the annual change and cumulative distributions.
      </figcaption>
      <div className="v3-timeline v3-timeline--explorer" role="group" aria-label="Eid Gift Kit distributions from 2020 through 2026">
        {milestones.map((item, index) => (
          <details className="v3-year v3-year--explorer" key={item.year}>
            <summary aria-label={`${item.year}: ${readableNumber(item.distributions)} documented Eid Kit distributions. Expand for details.`}>
              <strong>{item.year}</strong>
              <span>{readableNumber(item.distributions)}</span>
              <small>annual distributions</small>
              <span className="v3-eid-year-bar" aria-hidden="true">
                <i style={{ width: `${item.barPercent.toFixed(2)}%` }} />
              </span>
              <b className="v3-eid-year-expand" aria-hidden="true">+</b>
            </summary>
            <div className="v3-eid-year-detail">
              <p>
                {item.growthFromPrevious === null
                  ? "The first documented year in this series."
                  : `${item.growthFromPrevious >= 0 ? "+" : ""}${readableNumber(item.growthFromPrevious)} compared with ${milestones[index - 1]?.year}.`}
              </p>
              <p><b>{readableNumber(item.cumulativeDistributions)}</b> cumulative distributions through {item.year}.</p>
            </div>
          </details>
        ))}
      </div>
      <div className="v3-eid-total">
        <div><strong>{readableNumber(totalDistributions)}</strong><span>documented distributions over seven annual Eid drives</span></div>
        <p>These figures describe annual distributions, not a count of distinct families across different years.</p>
      </div>
    </figure>
  );
}
