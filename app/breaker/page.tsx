import type { Metadata } from "next";
import { BreakerPrototype } from "./breaker-client";

// Unlisted mechanics prototype — the "kill gate" for MONOLITH BREAKER.
// Not linked from the site, not indexed. Judge the fun, then decide.
export const metadata: Metadata = {
  title: "Monolith Breaker — prototype",
  robots: { index: false, follow: false },
};

export default function BreakerPage() {
  return <BreakerPrototype />;
}
