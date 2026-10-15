"use client";
import { lazy } from "react";

// One dynamic import boundary per payment form. Mixing static imports from
// server entry points with route-local lazy imports duplicates payment code
// and its styles in separate Turbopack client chunk groups.
export const LazyDonationForm = lazy(() => import("./donation-form")
  .then(module => ({ default: module.DonationForm })));
export const LazyDirectTransferForm = lazy(() => import("./direct-transfer-form")
  .then(module => ({ default: module.DirectTransferForm })));
