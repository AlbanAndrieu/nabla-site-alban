# Getting started with Speed Insights

This guide will help you get started with using Vercel Speed Insights on your project, showing you how to enable it, add the package to your project, deploy your app to Vercel, and view your data in the dashboard.

To view instructions on using the Vercel Speed Insights in your project for your framework, use the **Choose a framework** dropdown on the right (at the bottom in mobile view).

## This repository's implementation

For this static site, Speed Insights is loaded from `public/site-analytics.js` rather than from an npm framework package.

- Script path loaded at runtime: `/_vercel/speed-insights/script.js` (deferred).
- Default mode is `data-analytics-mode="vercel"`; other modes still call the same Vercel loader.
- Source of truth for integration patterns and attributes: `docs/frontend-runtime-scripts-runbook.md`.
- Test coverage for script wiring: `tests/site-analytics.spec.ts`.

Use this page for general Vercel reference, but prefer the runbook above when editing pages in `public/`.

## Prerequisites

- A Vercel account. If you don't have one, you can [sign up for free](https://vercel.com/signup).
- A Vercel project. If you don't have one, you can [create a new project](https://vercel.com/new).
- The Vercel CLI installed. If you don't have it, you can install it using the following command:

```bash
# pnpm
pnpm add vercel

# yarn
yarn add vercel

# npm
npm install vercel

# bun
bun add vercel
```

## Setup Steps

### Enable Speed Insights in Vercel

On the [Vercel dashboard](/dashboard), select your Project followed by the **Speed Insights** tab. You can also select the button below to be taken there. Then, select **Enable** from the dialog.

> **💡 Note:** Enabling Speed Insights will add new routes (scoped at `/_vercel/speed-insights/*`) after your next deployment.

### Add `@vercel/speed-insights` to your project

Using the package manager of your choice, add the `@vercel/speed-insights` package to your project:

```bash
# pnpm
pnpm add @vercel/speed-insights

# yarn
yarn add @vercel/speed-insights

# npm
npm install @vercel/speed-insights

# bun
bun add @vercel/speed-insights
```

### Add the `SpeedInsights` component to your app

The implementation depends on your framework. Below are examples for the most common frameworks:

#### Next.js (App Router - 13.5+)

Add the following component to the root layout:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Next.js</title>
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

#### Next.js (Pages Router - older than 13.5)

Create a dedicated component to avoid opting out from SSR on the layout and pass the pathname of the route to the `SpeedInsights` component:

```tsx
// app/insights.tsx
"use client";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { usePathname } from "next/navigation";

export function Insights() {
  const pathname = usePathname();
  return <SpeedInsights route={pathname} />;
}
```

Then, import the `Insights` component in your layout:

```tsx
import type { ReactNode } from "react";
import { Insights } from "./insights";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Next.js</title>
      </head>
      <body>
        {children}
        <Insights />
      </body>
    </html>
  );
}
```

#### React / Create React App

Add the following component to the main app file:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  return (
    <div>
      {/* ... */}
      <SpeedInsights />
    </div>
  );
}
```

#### SvelteKit

Add the following to your root file:

```ts
// src/routes/+layout.ts
import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";

injectSpeedInsights();
```

#### Remix

Add the following component to your root file:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/remix";

export default function App() {
  return (
    <html lang="en">
      <body>
        {/* ... */}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

#### Vue / Nuxt

For Vue or Nuxt projects, add the following component to your layout:

```vue
<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/vue";
</script>

<template>
  <SpeedInsights />
</template>
```

#### Astro

Speed Insights is available for both static and SSR Astro apps. To enable this feature, declare the `<SpeedInsights />` component from `@vercel/speed-insights/astro` near the bottom of one of your layout components, such as `BaseHead.astro`:

```astro
---
import SpeedInsights from "@vercel/speed-insights/astro";
const { title, description } = Astro.props;
---

<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />

<SpeedInsights />
```

Optionally, you can remove sensitive information from the URL by adding a `speedInsightsBeforeSend` function to the global `window` object:

```astro
---
import SpeedInsights from "@vercel/speed-insights/astro";
const { title, description } = Astro.props;
---

<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />

<script is:inline>
  function speedInsightsBeforeSend(data) {
    console.log("Speed Insights before send", data);
    return data;
  }
</script>

<SpeedInsights />
```

#### Other Frameworks

For other frameworks, import the `injectSpeedInsights` function from the package:

```js
import { injectSpeedInsights } from "@vercel/speed-insights";

injectSpeedInsights();
```

#### HTML

For static HTML sites, add the following scripts before the closing tag of the `<body>`:

```html
<script>
  window.si =
    window.si ||
    function () {
      (window.siq = window.siq || []).push(arguments);
    };
</script>
<script defer src="/_vercel/speed-insights/script.js"></script>
```

### Deploy your app to Vercel

You can deploy your app to Vercel's global [CDN](/docs/cdn) by running the following command from your terminal:

```bash
vercel deploy
```

Alternatively, you can [connect your project's git repository](/docs/git#deploying-a-git-repository), which will enable Vercel to deploy your latest pushes and merges to main.

Once your app is deployed, it's ready to begin tracking performance metrics.

> **💡 Note:** If everything is set up correctly, you should be able to find the `/_vercel/speed-insights/script.js` script inside the body tag of your page.

### View your data in the dashboard

Once your app is deployed, and users have visited your site, you can view the data in the dashboard.

To do so, go to your [dashboard](/dashboard), select your project, and click the **Speed Insights** tab.

After a few days of visitors, you'll be able to start exploring your metrics. For more information on how to use Speed Insights, see [Using Speed Insights](/docs/speed-insights/using-speed-insights).

## Privacy and Compliance

Learn more about how Vercel supports [privacy and data compliance standards](/docs/speed-insights/privacy-policy) with Vercel Speed Insights.

## Next steps

Now that you have Vercel Speed Insights set up, you can explore the following topics to learn more:

- [Learn how to use the `@vercel/speed-insights` package](/docs/speed-insights/package)
- [Learn about metrics](/docs/speed-insights/metrics)
- [Read about privacy and compliance](/docs/speed-insights/privacy-policy)
- [Explore pricing](/docs/speed-insights/limits-and-pricing)
- [Troubleshooting](/docs/speed-insights/troubleshooting)
