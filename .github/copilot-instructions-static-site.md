# Copilot Instructions for Static Website (public/)

This file provides specific guidance for working with the static website located in the `public/` directory.

## Overview

The `public/` directory contains the main static website for the "bababou" project. It includes HTML pages, CSS stylesheets, JavaScript files, and assets. The site is deployed via Cloudflare Workers and Vercel.

## File Structure

```
public/
├── index.html                        # Main homepage
├── 404.html                          # Custom 404 error page
├── test.html                         # Test page
├── arf.js                            # ARF visualization script
├── arf.json                          # ARF data
├── d3.v3.min.js                      # D3.js library (v3)
├── index.js                          # Main JavaScript
├── wireframe.css                     # Base layout styles
├── wireframe.scss                    # SCSS source (if used)
├── arf.css                           # ARF-specific styles
├── theme.css                         # Theme and dark mode styles
├── theme-toggle.js                   # Dark/light mode toggle
├── google-translate-config.js        # Google Translate configuration
├── landing-sections.css                  # Modern styling
├── print.css                         # Print-specific styles
├── robots.txt                        # Search engine crawler rules
├── sitemap-albandrieu-com.xml        # Site sitemap for SEO
├── security.txt                      # Security contact information
├── favicon.ico                       # Site favicon
├── CNAME                             # Custom domain configuration
├── .assetsignore                     # Assets to ignore
├── assets/                           # Images and media files
└── policy/                           # Legal documents
    ├── privacy_policy.html
    ├── service_terms.html
    └── gnu_general_public_license.txt
```

## Development

### Local Development Servers

**Option 1: Cloudflare Wrangler (Recommended)**
```bash
# From project root
npm run start
# OR
npm run dev
# OR
wrangler dev
```
Serves at `http://localhost:8787`

**Option 2: Python HTTP Server**
```bash
# From project root
npm run start-python
# OR
python -m http.server 8001
```
Serves at `http://localhost:8001`

### File Watching

When developing:
1. Make changes to HTML/CSS/JS files in `public/`
2. Refresh browser to see changes (no build step needed)
3. For SCSS changes: Compile to CSS manually or use a watcher

## HTML Guidelines

### Page Structure Template

All HTML pages should follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page Title - Bababou</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="Page description (150-160 chars)">
    <meta name="keywords" content="relevant, keywords">
    <meta name="author" content="Alban Andrieu">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://bababou.albandrieu.com/page.html">
    <meta property="og:title" content="Page Title">
    <meta property="og:description" content="Page description">
    <meta property="og:image" content="https://bababou.albandrieu.com/path/to/image.jpg">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Page Title">
    <meta name="twitter:description" content="Page description">

    <!-- Stylesheets -->
    <link rel="stylesheet" href="/wireframe.css">
    <link rel="stylesheet" href="/arf.css">
    <link rel="stylesheet" href="/theme.css">
    <link rel="stylesheet" href="/print.css" media="print">

    <!-- Theme Toggle (load early to prevent flash) -->
    <script src="/theme-toggle.js"></script>

    <!-- Google Translate -->
    <script src="/google-translate-config.js"></script>
    <script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

    <link rel="icon" href="/favicon.ico">
</head>
<body>
    <!-- Skip to main content link (accessibility) -->
    <a href="#main-content" class="skip-to-main">Skip to main content</a>

    <!-- Navigation -->
    <nav aria-label="Main navigation">
        <!-- Navigation content -->
    </nav>

    <!-- Google Translate Widget -->
    <div class="google-translate-widget">
        <div id="google_translate_element"></div>
    </div>

    <!-- Theme Toggle Button -->
    <button id="theme-toggle" aria-label="Toggle dark mode">
        <!-- Toggle icon -->
    </button>

    <!-- Main Content -->
    <main id="main-content">
        <h1>Page Title</h1>
        <!-- Content -->
    </main>

    <!-- Footer -->
    <footer aria-label="Site footer">
        <!-- Footer content -->
    </footer>

    <!-- Scripts -->
    <script src="/index.js"></script>
</body>
</html>
```

### HTML Best Practices

1. **Semantic HTML**
   - Use `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`
   - Only one `<h1>` per page
   - Maintain heading hierarchy (don't skip levels)

2. **Accessibility**
   - Include skip links: `<a href="#main-content" class="skip-to-main">Skip to main content</a>`
   - Use ARIA labels: `aria-label`, `aria-labelledby`, `aria-hidden`
   - All images must have `alt` attributes
   - Associate labels with form inputs

3. **Responsive Design**
   - Viewport meta tag is mandatory: `<meta name="viewport" content="width=device-width, initial-scale=1">`
   - Use Bootstrap classes: `col-md-6`, `img-fluid`, etc.
   - Test on mobile, tablet, and desktop

## CSS Guidelines

### CSS Files Organization

1. **wireframe.css** - Base layout, Bootstrap overrides, grid system
2. **arf.css** - Application-specific styles
3. **theme.css** - CSS custom properties (variables), dark mode
4. **landing-sections.css** - Modern styling enhancements
5. **print.css** - Print-specific styles

### CSS Custom Properties (Variables)

**ALWAYS use CSS variables for colors and spacing:**

```css
/* Use existing variables from theme.css */
color: var(--text-primary);
background-color: var(--bg-primary);
border-color: var(--border-color);

/* Available variables: */
/* Backgrounds: --bg-primary, --bg-secondary, --bg-card */
/* Text: --text-primary, --text-secondary, --text-muted */
/* Interactive: --link-color, --link-hover, --button-bg, --button-hover */
/* Borders/Shadows: --border-color, --shadow-color, --shadow-hover */
/* Alerts: --alert-info-bg, --alert-success-bg, --alert-warning-bg */
/* Navigation: --nav-bg, --nav-text */
```

### Dark Mode Implementation

Theme toggle is implemented in `theme-toggle.js` and styles in `theme.css`:

```css
/* Light mode (default) - in :root */
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
}

/* Dark mode - in [data-theme="dark"] */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}
```

**Never hardcode colors** - always use CSS variables so dark mode works correctly.

### Responsive Breakpoints

Using Bootstrap 5.2.1 breakpoints:
- `sm`: 576px (small devices)
- `md`: 768px (tablets)
- `lg`: 992px (desktops)
- `xl`: 1200px (large desktops)

```css
/* Mobile-first approach */
.element {
  width: 100%;
}

@media (min-width: 768px) {
  .element {
    width: 50%;
  }
}
```

### Print Styles

Print styles in `print.css` and `theme.css` `@media print`:

```css
@media print {
  /* Hide interactive elements */
  nav, .google-translate-widget, .theme-toggle {
    display: none !important;
  }

  /* Optimize for print */
  body {
    background: white;
    color: black;
    font-size: 12pt;
  }

  /* Prevent page breaks inside elements */
  h1, h2, h3, p {
    page-break-inside: avoid;
  }
}
```

## JavaScript Guidelines

### Core JavaScript Files

1. **index.js** - Main application logic
2. **arf.js** - ARF visualization (uses D3.js v3)
3. **theme-toggle.js** - Dark/light mode toggle
4. **google-translate-config.js** - Translation configuration

### Best Practices

1. **No Build Step**
   - Write ES5-compatible code or use modern JS that browsers support
   - Avoid using build tools unless necessary
   - Test in all target browsers

2. **Event Handling**
   ```javascript
   // Use addEventListener, not inline handlers
   document.getElementById('myButton').addEventListener('click', function(e) {
     e.preventDefault();
     // Handle click
   });
   ```

3. **DOM Manipulation**
   ```javascript
   // Wait for DOM to load
   document.addEventListener('DOMContentLoaded', function() {
     // Initialize scripts
   });
   ```

4. **Avoid jQuery** unless already included
   - Use vanilla JavaScript instead
   - Modern DOM APIs are sufficient

### D3.js Visualization (arf.js)

The site uses D3.js v3 for ARF visualization:

```javascript
// arf.js uses D3.js v3 API
d3.select('#visualization')
  .append('svg')
  .attr('width', width)
  .attr('height', height);
```

**Note:** D3.js v3 is older - if updating, consider migrating to v7 (available in node_modules).

## Google Translate Integration

Configuration in `google-translate-config.js`:

```javascript
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: 'en',
      includedLanguages: 'en,fr,no,de,es,it,pt,nl,sv,da,fi,pl,cs,ru,ar,ja,zh-CN',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    },
    'google_translate_element'
  );
}
```

**Supported Languages:** English, French, Norwegian, German, Spanish, Italian, Portuguese, Dutch, Swedish, Danish, Finnish, Polish, Czech, Russian, Arabic, Japanese, Chinese Simplified.

### Adding Translate Widget to New Pages

```html
<!-- In <head> -->
<script src="/google-translate-config.js"></script>
<script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

<!-- In <body> -->
<div class="google-translate-widget">
  <div id="google_translate_element"></div>
</div>
```

## SEO & Metadata

### Robots.txt

Located at `public/robots.txt` - controls crawler access:

```
User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /

Sitemap: https://bababou.albandrieu.com/sitemap-albandrieu-com.xml
```

**When to update:**
- Block specific crawlers (AI scrapers, etc.)
- Restrict access to certain paths
- Update sitemap URL

### Sitemap

Located at `public/sitemap-albandrieu-com.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bababou.albandrieu.com/index.html</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>2024-01-15</lastmod>
  </url>
</urlset>
```

**CRITICAL: Update sitemap when adding/removing pages:**
1. Add new `<url>` entry for each new page
2. Set appropriate `<priority>` (1.0 for homepage, 0.8 for main pages, 0.5 for secondary)
3. Set `<changefreq>` based on update frequency
4. Update `<lastmod>` when content changes
5. Submit to Google Search Console after updates

### Security.txt

Located at `public/security.txt` - security contact information:

```
Contact: mailto:security@albandrieu.com
Expires: 2025-12-31T23:59:59.000Z
Preferred-Languages: en, fr
```

Update the expiration date annually.

## Assets

### Images

Store in `public/assets/`:
- Use descriptive filenames
- Optimize images (compress, use appropriate formats)
- Provide alt text in HTML
- Consider WebP format for modern browsers

### Favicons

- `favicon.ico` - Standard favicon (16x16, 32x32)
- Consider adding other sizes for different devices

## Legal Pages

Located in `public/policy/`:
- `privacy_policy.html` - Privacy policy
- `service_terms.html` - Terms of service
- `gnu_general_public_license.txt` - GPL license

**When to update:**
- Changes to data collection practices
- New third-party integrations
- Legal requirement changes

## Third-Party Integrations

Current integrations:
- **Google Translate** - Multi-language support
- **Google Analytics** - Web analytics (if configured)
- **Mixpanel** - Analytics (if configured)
- **VWO** - A/B testing (if configured)
- **PostHog** - Product analytics (if configured)

**Security Note:** Review all third-party scripts before adding. Use Subresource Integrity (SRI) when possible.

## Testing

### Before Committing

1. **HTML Validation**
   - Pre-commit hooks run `htmllint` and `htmlhint`
   - Or use [W3C Validator](https://validator.w3.org/)

2. **Accessibility Testing**
   - Keyboard navigation (Tab, Enter, Esc)
   - Screen reader testing (NVDA, JAWS, VoiceOver)
   - Color contrast (WCAG AA: 4.5:1 ratio)

3. **Responsive Testing**
   - Mobile (320px+)
   - Tablet (768px+)
   - Desktop (1024px+)
   - Use browser DevTools device emulation

4. **Theme Testing**
   - Toggle between light and dark modes
   - Verify all content is readable

5. **Translation Testing**
   - Test at least 2-3 language translations
   - Verify layout doesn't break

6. **Print Testing**
   - Use browser print preview
   - Verify PDF generation

7. **Browser Testing**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

### Performance Testing

Run Lighthouse in Chrome DevTools:
- **Target Scores:**
  - Performance: 90+
  - Accessibility: 95+
  - Best Practices: 95+
  - SEO: 95+

## Deployment

### Cloudflare Workers

Configured via `wrangler.jsonc` in project root:

```bash
# From project root
npm run deploy
# OR
wrangler deploy
```

### Vercel

Configured via `vercel.json` in project root:

```bash
# From project root
vercel deploy        # Preview
vercel --prod        # Production
```

## Common Issues

1. **Theme flash on page load**
   - Ensure `theme-toggle.js` is loaded in `<head>` before body content
   - Script sets theme before page renders

2. **Translate widget not appearing**
   - Check both scripts are loaded
   - Verify `google_translate_element` div exists
   - Check browser console for errors

3. **Styles not applying**
   - Clear browser cache
   - Check CSS file paths are correct
   - Verify CSS is not being overridden

4. **Images not loading**
   - Check file paths (relative to `public/`)
   - Verify image files exist
   - Check file permissions

## Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.2/)
- [D3.js v3 Documentation](https://github.com/d3/d3-3.x-api-reference/blob/master/API-Reference.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Google Translate Widget Docs](https://cloud.google.com/translate/docs/advanced/translate-website-widget)
