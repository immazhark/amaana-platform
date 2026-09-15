import { ImageResponse } from "next/og";
import { AmaanaSocialCard } from "@/components/amaana-social-card";

export const alt = "Amaana Foundation — Upholding Trust. Serving With Compassion, Dignity and Accountability.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<AmaanaSocialCard />, size);
}
