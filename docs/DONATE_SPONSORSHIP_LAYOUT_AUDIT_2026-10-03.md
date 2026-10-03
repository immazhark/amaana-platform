# Donate and Sponsor Education screenshot correction

The owner identified Donate's first body section as incorrectly aligned and oversized, with its second section as the reference. The additional Sponsor Education screenshot marked excessive supporting typography.

Donate's first block now explicitly selects the existing canonical default presentation, matching the adjacent two-paragraph domestic-donations block. This avoids placing a shared split heading inside an incompatible canonical grid and restores identical heading size without adding CSS overrides or changing other routes.

Sponsor Education's school/college lead uses the shared body face and responsive1–1.18rem scale, normal1.75 line-height, zero top margin and readable foreground. Both desktop columns align at the top; existing mobile stacking and enquiry link remain.

Validation: typecheck/build pass; lint has one existing importer warning. Mechanical detector emitted no findings.23 CI planner tests pass. Added actual route geometry coverage at320/390/768/1024/1440/1920, checking matching Donate headings, shell alignment, mobile stacking, sponsorship body face/scale, column tops and overflow. Focused CI retains donation journeys, participation, SEO, typography and performance; API changes and releases remain full acceptance.

PR142 head `fa0f6e2a5ed1f72885141614563437cac22627ab`, merge `e20149276b6bb864c082f5a15b718eeeec85bc4a`. Local/tested/remote/merged tree `169bff6630a97da8e724bae96d658c82dcec47c4` matches. PR CI37117208040 SUCCESS:103 Chromium checks passed first attempt in1.9minutes. Integration CI37117505771 SUCCESS; duplicate browser acceptance skipped. Production JS819181/819200,CSS347746/348160; budgets unchanged.

Railway review deployment `f58aa5cc-5729-4f35-ba59-35bed9156977` SUCCESS on exact merge. Postdeployment desktop browser DOM confirms Donate headings40.89px and left82px, supporting columns643.11px. Before correction first heading56px/left643.11px; reference heading40.89px/left82px. Sponsor lead changed from40px Georgia/70px line-height to18.88px Arial/33.04px; both column tops1657.75px, no horizontal overflow. Donate rendered screenshot inspected. Six-width responsive evidence is seeded CI, not live cloud viewport resizing.

No factual/copy/query/payment/privacy/media/artwork/Companion changes; main and protected PR104 remain untouched. Task complete; no claim that every other route is defect-free.
