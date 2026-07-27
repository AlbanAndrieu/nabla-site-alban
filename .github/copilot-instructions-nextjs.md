# Copilot Instructions for Next.js Application (app/)

This file provides specific guidance for working with the Next.js application located in the `app/` directory.

## Overview

The `app/` directory contains a Next.js 16.0.10 application built with React 19.2.0 and TypeScript. It uses Tailwind CSS for styling and includes Vercel Analytics and Speed Insights.

## Technology Stack

- **Next.js**: 16.0.10 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x with @tailwindcss/postcss
- **Vercel Analytics**: 1.5.0
- **Vercel Speed Insights**: 1.2.0

## Project Structure

```
app/
├── app/                    # Next.js App Router directory
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── public/                 # Static assets for Next.js app
├── node_modules/           # Dependencies
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration (Tailwind)
├── tsconfig.json           # TypeScript configuration
└── README.md               # Documentation
```

## Development Setup

### Prerequisites

**CRITICAL:** This application requires:
- Node.js >= 24.11.0
- npm >= 11.6.2
- pnpm ^10.22.0

Use `.nvmrc` in the root directory:
```bash
cd /path/to/nabla-site-bababou
nvm use
```

### Installation

**ALWAYS install dependencies before development:**

```bash
cd app
npm install
# OR
pnpm install
```

### Development Server

```bash
cd app
npm run dev
```

The application will be available at `http://localhost:3000`.

**Hot Reload:** Changes to files in the `app/` directory trigger automatic reloading.

### Building

```bash
cd app
npm run build
```

This creates an optimized production build in `.next/` directory.

### Production Server

```bash
cd app
npm run start
```

Starts the production server (requires build first).

## Linting

**ALWAYS run linting before committing:**

```bash
cd app
npm run lint
```

The ESLint configuration extends `eslint-config-next` for Next.js-specific rules.

## Code Standards

### TypeScript Guidelines

1. **Type Safety**
   - Use explicit types for function parameters and return values
   - Avoid `any` type unless absolutely necessary
   - Use TypeScript's built-in utility types (`Partial`, `Pick`, `Omit`, etc.)
   - Define interfaces for component props

2. **Component Typing**
   ```typescript
   // Good - Explicit prop types
   interface ButtonProps {
     label: string;
     onClick: () => void;
     disabled?: boolean;
   }

   export default function Button({ label, onClick, disabled = false }: ButtonProps) {
     // Component logic
   }
   ```

3. **Async/Await**
   - Use async/await for asynchronous operations
   - Handle errors with try/catch blocks
   - Type async function return values

### React Best Practices

1. **Server vs Client Components**
   - **Default to Server Components** (no "use client" directive)
   - Only use Client Components when:
     - Using React hooks (useState, useEffect, etc.)
     - Handling browser events (onClick, onChange, etc.)
     - Using browser-only APIs
   - Mark with `"use client"` directive at top of file

2. **Component Structure**
   ```typescript
   // Server Component (default)
   export default function ServerComponent() {
     // Can fetch data directly
     return <div>Content</div>;
   }

   // Client Component (interactive)
   "use client";

   import { useState } from "react";

   export default function ClientComponent() {
     const [count, setCount] = useState(0);
     return <button onClick={() => setCount(count + 1)}>{count}</button>;
   }
   ```

3. **File Naming**
   - Components: PascalCase (e.g., `MyComponent.tsx`)
   - Pages: lowercase (e.g., `page.tsx`, `layout.tsx`)
   - Utilities: camelCase (e.g., `utils.ts`)

### Next.js App Router Conventions

1. **File-based Routing**
   - `app/page.tsx` → `/` (homepage)
   - `app/about/page.tsx` → `/about`
   - `app/blog/[slug]/page.tsx` → `/blog/:slug` (dynamic route)

2. **Special Files**
   - `layout.tsx` - Shared UI for a route segment
   - `page.tsx` - Unique UI for a route
   - `loading.tsx` - Loading UI (Suspense boundary)
   - `error.tsx` - Error UI (Error boundary)
   - `not-found.tsx` - 404 UI

3. **Metadata API**
   ```typescript
   // Static metadata
   export const metadata = {
     title: 'Page Title',
     description: 'Page description',
   };

   // Dynamic metadata
   export async function generateMetadata({ params }) {
     return {
       title: `Dynamic Title`,
     };
   }
   ```

### Tailwind CSS Guidelines

1. **Utility-First Approach**
   - Use Tailwind utility classes for styling
   - Avoid custom CSS unless necessary
   - Use `@apply` directive sparingly

2. **Responsive Design**
   ```tsx
   <div className="w-full md:w-1/2 lg:w-1/3">
     {/* Mobile-first: full width, then half on medium screens, third on large */}
   </div>
   ```

3. **Dark Mode**
   ```tsx
   <div className="bg-white dark:bg-gray-900 text-black dark:text-white">
     {/* Automatically adapts to user's system preference */}
   </div>
   ```

4. **Custom Configuration**
   - Extend theme in `tailwind.config.ts`
   - Use semantic color names
   - Define reusable spacing/sizing values

### Performance Optimization

1. **Image Optimization**
   ```tsx
   import Image from 'next/image';

   <Image
     src="/path/to/image.jpg"
     alt="Description"
     width={500}
     height={300}
     priority // For above-the-fold images
   />
   ```

2. **Font Optimization**
   - Use `next/font` for optimized font loading
   - Already configured in `app/layout.tsx` with Geist font

3. **Code Splitting**
   - Use dynamic imports for large components
   ```tsx
   import dynamic from 'next/dynamic';

   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <p>Loading...</p>,
   });
   ```

4. **Data Fetching**
   - Fetch data in Server Components when possible
   - Use React Suspense for streaming
   - Implement proper caching strategies

### Analytics Integration

The application includes:
- **Vercel Analytics** - Page views and web vitals
- **Vercel Speed Insights** - Core Web Vitals tracking

Both are already configured in the root layout. No additional setup needed.

## Testing

### Before Committing

1. **Lint the code:**
   ```bash
   cd app
   npm run lint
   ```

2. **Build verification:**
   ```bash
   cd app
   npm run build
   ```

3. **Manual testing:**
   - Test in development mode (`npm run dev`)
   - Verify responsive design at different breakpoints
   - Check dark mode if implemented
   - Test all interactive features

### Browser Testing

Test in modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Deployment

### Vercel Deployment (Recommended)

The Next.js app is configured for Vercel deployment:

```bash
# From project root
vercel deploy        # Preview
vercel --prod        # Production
```

Vercel automatically:
- Detects Next.js configuration
- Builds the application
- Optimizes for production
- Provides preview URLs for PRs

### Environment Variables

Store sensitive values in `.env.local` (not committed to git):

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
```

**Important:**
- Prefix client-side variables with `NEXT_PUBLIC_`
- Server-side variables don't need prefix
- Add `.env.local` to `.gitignore`

## Common Patterns

### Data Fetching (Server Component)

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

### Form Handling (Client Component)

```typescript
"use client";

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      {/* More fields */}
    </form>
  );
}
```

### Route Handlers (API Routes)

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: Request) {
  const body = await request.json();
  // Process request
  return NextResponse.json({ success: true });
}
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npm install` in `app/` directory
   - Check TypeScript paths in `tsconfig.json`

2. **Build errors**
   - Clear `.next` directory: `rm -rf .next`
   - Rebuild: `npm run build`

3. **Port conflicts**
   - Default port 3000 is in use
   - Specify different port: `PORT=3001 npm run dev`

4. **TypeScript errors**
   - Run type checking: `npx tsc --noEmit`
   - Check `tsconfig.json` configuration

5. **Tailwind classes not working**
   - Verify `tailwind.config.ts` content paths
   - Check PostCSS configuration
   - Restart dev server

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)

## Migration Notes

This application uses:
- **Next.js 16.x** (latest features and improvements)
- **React 19.x** (latest React version with new features)
- **App Router** (not Pages Router - different conventions)
- **Tailwind CSS 4.x** (with @tailwindcss/postcss plugin)

If migrating from older versions, consult the official upgrade guides.
