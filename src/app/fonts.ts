import { Cormorant_Garamond, Manrope } from "next/font/google";

export const amaanaBodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-amaana-body",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const amaanaDisplayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-amaana-display",
  fallback: ["Georgia", "Times New Roman", "serif"],
});
