const config = {
  rules: {
    "color-no-hex": true,
    "no-duplicate-selectors": true,
  },
  overrides: [
    {
      files: ["src/app/stories.css"],
      rules: {
        // This legacy route intentionally has later polish and responsive overrides.
        // Enforce tokens now; consolidate the cascade before enabling this rule here.
        "no-duplicate-selectors": null,
        // Stories consumes canonical RGB channels; alpha remains route-owned.
        "declaration-property-value-disallowed-list": {
          "/.*/": ["/\\brgba?\\(\\s*(?:[0-9]|\\.)/"],
        },
      },
    },
  ],
};

export default config;
