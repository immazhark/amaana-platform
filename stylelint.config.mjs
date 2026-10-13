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
      },
    },
  ],
};

export default config;
