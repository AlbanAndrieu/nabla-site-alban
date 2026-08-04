# Engineering TODO

This document tracks medium-term technical debt that should be addressed after current feature work.

## Accessibility

### Shared SkipToMainContent migration

**Status:** 🚧 In progress

Completed:

- [x] startup
- [x] startup-thanks

Remaining:

- [ ] app/[locale]/page.tsx
- [ ] app/[locale]/ai/page.tsx
- [ ] app/[locale]/security/page.tsx
- [ ] app/[locale]/freenas/page.tsx
- [ ] app/[locale]/truenas/page.tsx
- [ ] app/[locale]/workstation/page.tsx
- [ ] app/[locale]/email/page.tsx
- [ ] app/[locale]/expertise/page.tsx
- [ ] app/[locale]/ciso/page.tsx
- [ ] app/[locale]/pricing/page.tsx
- [ ] app/[locale]/link/page.tsx
- [ ] app/[locale]/nabla/page.tsx
- [ ] app/[locale]/checkout-tjm/page.tsx
- [ ] app/[locale]/cv/[...path]/page.tsx
- [ ] components/payments/PaymentShell.tsx

## Acceptance criteria

- remove duplicated skip-to-main markup;
- use the shared SkipToMainContent component everywhere;
- every page exposes <main id="main-content">;
- add regression tests.