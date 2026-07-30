import type { ReactNode } from "react";

/**
 * Matches legacy public/checkout.html head: arf, site-content-page, checkout styles
 * (root layout did not include these, so the card looked unstyled).
 */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/arf.css" />
      <link rel="stylesheet" href="/site-content-page.css" />
      <link rel="stylesheet" href="/checkout.css" />
      {children}
    </>
  );
}
