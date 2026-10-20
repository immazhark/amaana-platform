"use client";

import { useState } from "react";
import { BodyCarousel, BodyCard } from "./body-carousel";

function ProgrammeFlag({ id }: { id: number }) {
  const [marked, setMarked] = useState(false);
  return <button type="button" aria-pressed={marked} onClick={() => setMarked(value => !value)}>
    Mark programme {id}
  </button>;
}

export function BodyCarouselUpdateFixture() {
  const [count, setCount] = useState(7);
  const [reversed, setReversed] = useState(false);
  const ids = Array.from({ length: count }, (_, index) => index + 1);
  if (reversed) ids.reverse();
  return (
    <>
      <button type="button" onClick={() => setCount(0)}>Clear records</button>
      <button type="button" onClick={() => setCount(2)}>Show two records</button>
      <button type="button" onClick={() => setCount(7)}>Restore seven records</button>
      <button type="button" onClick={() => setReversed(value => !value)}>Reverse programme order</button>
      <BodyCarousel label="Body carousel acceptance" heading={<h2>Programme records</h2>} autoAdvanceMs={3000}>
        {ids.map(id => (
          <BodyCard key={id} title={`Programme ${id}`} meta={2019 + id}>
            <p>A documented programme record.</p>
            <ProgrammeFlag id={id} />
            <a href="/about">Explore programme</a>
          </BodyCard>
        ))}
      </BodyCarousel>
    </>
  );
}
