const config = {
  rules: {
    "color-no-hex": true,
    "no-duplicate-selectors": true,
    // A property declared twice in one block is dead code unless it is a deliberate fallback pair
    // (consecutive, different values, e.g. 100vh then 100dvh). Appended override blocks left 15 of these.
    "declaration-block-no-duplicate-properties": [true, { ignore: ["consecutive-duplicates-with-different-values"] }],
  },
};

export default config;
