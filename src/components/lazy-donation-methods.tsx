"use client";
import { lazy } from "react";

// Both server entry points and appeal selection share this import boundary.
export const LazyDonationMethods = lazy(() => import("./donation-methods")
  .then(module => ({ default: module.DonationMethods })));
