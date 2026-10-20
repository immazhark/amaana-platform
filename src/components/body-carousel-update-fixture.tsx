"use client";

import { useState } from "react";
import { BodyCarousel, BodyCard } from "./body-carousel";

export function BodyCarouselUpdateFixture() {
  const [count, setCount] = useState(7);
  return (
    <>
      <button type="button" onClick={() => setCount(0)}>Clear records</button>
      <button type="button" onClick={() => setCount(2)}>Show two records</button>
      <button type="button" onClick={() => setCount(7)}>Restore seven records</button>
      <BodyCarousel label="Body carousel acceptance" heading={<h2>Programme records</h2>} autoAdvanceMs={3000}>
        {Array.from({ length: count }, (_, index) => (
          <BodyCard key={index} title={`Programme ${index + 1}`} meta={2020 + index}>
            <p>A documented programme record.</p>
            <a href="/about">Explore programme</a>
          </BodyCard>
        ))}
      </BodyCarousel>
    </>
  );
}
