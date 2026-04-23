# Copilot Instructions for nabla-site-alban

## Repository Overview

This is the nabla-site-nabla repository, a static website project for "nabla" created for Job search. The repository contains:

- A static website in the `public/` directory
- A Next.js application in the `app/` directory
- Cloudflare Workers configuration for deployment
- Vercel deployment configuration

**Languages & Technologies:**
- JavaScript/TypeScript (Node.js v24.11.0+, npm v11.6.2+, pnpm v10.22.0+)
- Next.js 16.0.7 with React 19.2.0
- Cloudflare Workers (wrangler)
- Vercel deployment platform

## Project Structure

### Root Directory Files
- `package.json` - Root package configuration with build scripts and dependencies
- `vercel.json` - Vercel deployment configuration (`rootDirectory`: `app` for Next.js)
- `wrangler.jsonc` - Cloudflare Workers configuration (assets: `./public`)
- `eslint.config.js` - ESLint configuration for the project
- `commitlint.config.ts` - Commitlint configuration with emoji support

### Key Directories
- `public/` - Static assets directory served by Cloudflare/Vercel (HTML, CSS, JS, JSON)
- `app/` - Next.js application (separate package with its own package.json)
- `api/` - Optional Vercel serverless handlers (for example `hello.js`); not PHP
- `scripts/` - Utility scripts (e.g., `run-wicked.sh`)
- `.github/workflows/` - SDLC workflows (OpenCommit action)

### Configuration Files
- `.mega-linter.yml` - MegaLinter configuration (comprehensive multi-language linter)
- `.pre-commit-config.yaml` - Pre-commit hooks configuration (extensive validation)
- `.yamllint` - YAML linting configuration
- `.ansible-lint` - Ansible linting configuration
- `Pipfile` - Python dependencies (ansible-lint, gitlint)

## Build & Development Commands

### Installation & Setup
**ALWAYS run installation before building or running:**
```bash
# Install root dependencies (REQUIRED before any build/start)
pnpm install
# OR
npm install

# For app Next.js project
cd app && pnpm install
```

The postinstall script automatically:
- Copies d3.min.js to index/dist/scripts/d3
- Copies arf.js to dist/scripts/
- Copies resources/*.json to dist/resources
- Copies index.html and wireframe.css to dist/

### Development Servers

**Root Project (Static Site):**
```bash
# Cloudflare Workers dev server (primary method)
npm run start
# OR
npm run dev
# OR
wrangler dev
```

**Next.js App (app/):**
```bash
cd app
npm run dev
# Opens at http://localhost:3000
```

### Linting
**ALWAYS run linting before committing code:**
```bash
# Root project ESLint
npm run lint

# app ESLint
cd app && npm run lint
```

The project has extensive pre-commit hooks configured in `.pre-commit-config.yaml` that run automatically on commit, including:
- File format checks (trailing whitespace, end-of-file, line endings)
- Code quality (ESLint, Ruff for Python, shellcheck for bash)
- Security checks (gitleaks, bandit, detect-private-key)
- YAML/JSON/TOML validation
- HTML and markdown linting

### Building

**Next.js App:**
```bash
cd app
npm run build
```

**Note:** The root project does not have a separate build step as it serves static files directly from `public/`.

### Deployment

**Vercel Deployment:**
```bash
vercel deploy        # Preview deployment
vercel --prod        # Production deployment
```

**Cloudflare Workers:**
```bash
npm run deploy
# OR
wrangler deploy
```

## SDLC & Validation

### GitHub Workflows
- `.github/workflows/opencommit.yml` - OpenCommit action for automated commit message generation (runs on all branches except main/master/dev/development/release)

### Pre-commit Hooks
The repository uses extensive pre-commit hooks. To install them:
```bash
pre-commit install
```

**Important:** Many linters and formatters run automatically via pre-commit hooks, including:
- Python: ruff, pyupgrade, bandit
- Shell: shfmt, shellcheck, bashate
- JavaScript: biome, htmllint, htmlhint
- YAML: yamllint, prettier
- Security: gitleaks, encryption-check

### MegaLinter
The project uses MegaLinter with specific disabled linters (see `.mega-linter.yml`). Disabled categories include:
- CLOUDFORMATION, EDITORCONFIG, MARKDOWN, SPELL, JAVASCRIPT, CSS_SCSS_LINT, CSS_STYLELINT, TEKTON

## Important Development Notes

### Node.js Version Requirements
**CRITICAL:** This project requires:
- Node.js >= 24.11.0
- npm >= 11.6.2
- pnpm ^10.22.0

Use `.nvmrc` for version management:
```bash
nvm use
```

### Python Dependencies
Python 3.12 is required. Install Python dependencies with:
```bash
pipenv install --dev
```

### Commit Message Format
The project uses commitlint with conventional commits and emoji support. Valid commit types:
- `build`, `chore`, `ci`, `docs`, `feat`, `feature`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`

Example commit messages:
```
feat: add new feature
fix(scope): fix bug in component
🛠️  build: update dependencies
```

### ESLint Ignores
The following directories are ignored by ESLint (see `eslint.config.js`):
- `node_modules/`, `.next/`, `out/`, `build/`, `dist/`, `.turbo/`
- `app/node_modules/`, `app/.next/`, `.vercel/`, `.cache/`, `.pnpm/`
- `public/**/*.min.js`, `public/d3.v3.min.js`, `public/index.js`, `public/arf.js`
- `api/**`, `index/**`

### Common Issues & Workarounds

1. **Always install dependencies first** - The postinstall script is critical for setting up the project correctly
2. **Use pnpm** - This project is configured for pnpm workspaces
3. **Python server timeout** - If using Python HTTP server, it may be slower than Cloudflare Workers dev server
4. **Pre-commit hooks may be slow** - Some hooks (like mega-linter, ansible-lint) are disabled in `.pre-commit-config.yaml` because they're too slow
5. **Large files excluded** - Several large files are excluded from git (see `.pre-commit-config.yaml` check-added-large-files)

### Shell Script Notes
The `scripts/run-wicked.sh` script is excluded from some linting checks (bashate, shell-lint) due to specific code patterns.

## Validation Steps

Before submitting a PR:
1. Run `pnpm install` to ensure dependencies are up to date
2. Run `npm run lint` to check for linting errors
3. For Next.js changes: `cd app && npm run build` to verify builds successfully
4. Test locally with `npm run start` (Cloudflare) or `npm run start-python` (Python server)
5. Verify pre-commit hooks pass (if installed)

## Key Resources & Documentation

- Repository: https://github.com/AlbanAndrieu/nabla-site-nabla
- Issue Tracker: https://github.com/AlbanAndrieu/nabla-site-nabla/issues
- License: Apache v2
- Vercel deployment: Configured via `vercel.json`
- Cloudflare Workers: Configured via `wrangler.jsonc`

## Search Guidance

When exploring the codebase:
- Static site files: Look in `public/` directory
- Next.js app: Look in `app/` directory
- API endpoints: Look in `api/` directory
- Build configurations: Check root-level config files (package.json, vercel.json, wrangler.jsonc)
- Linting configs: Check `.eslintrc`, `.mega-linter.yml`, `.pre-commit-config.yaml`
- SDLC: Check `.github/workflows/`

## HTML/CSS Best Practices

### Accessibility Requirements

**ALWAYS ensure accessibility standards are met when working with HTML:**

1. **Semantic HTML Elements**
   - Use semantic tags: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>`
   - Use proper heading hierarchy (`<h1>` to `<h6>`) - only one `<h1>` per page
   - Use `<button>` for actions, `<a>` for navigation

2. **ARIA Attributes**
   - Add `aria-label` or `aria-labelledby` to navigation elements and sections
   - Use `aria-hidden="true"` for decorative icons/elements
   - Include `role` attributes when semantic HTML isn't sufficient
   - Example landmarks already in use:
     - `<nav aria-label="Main navigation">`
     - `<footer aria-label="Site footer">`
     - `<section aria-labelledby="main-heading">`

3. **Skip Links**
   - Include skip-to-content links for keyboard navigation: `<a href="#main-content" class="skip-to-main">Skip to main content</a>`
   - Main content should have `id="main-content"` and be wrapped in `<main>` tag

4. **Images and Media**
   - All images must have meaningful `alt` text (or `alt=""` for decorative images)
   - Use `aria-hidden="true"` for decorative images with empty alt text
   - Ensure sufficient color contrast ratios (WCAG AA standard: 4.5:1 for normal text)

5. **Forms and Inputs**
   - Always associate labels with form inputs using `for` and `id` attributes
   - Provide clear error messages and validation feedback
   - Use appropriate input types (`email`, `tel`, `date`, etc.)

6. **Keyboard Navigation**
   - Ensure all interactive elements are keyboard accessible
   - Maintain logical tab order
   - Provide visible focus indicators (`:focus` styles)

### Responsive Design Guidelines

**All HTML/CSS changes must be mobile-responsive:**

1. **Viewport Configuration**
   - Always include viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
   - This is already configured in all HTML files

2. **Mobile-First Approach**
   - Design for mobile screens first, then enhance for larger screens
   - Use responsive units: `rem`, `em`, `%`, `vw`, `vh` instead of fixed `px`
   - Bootstrap 5.2.1 is included - leverage its responsive grid system

3. **Responsive Images**
   - Use `max-width: 100%` and `height: auto` for images
   - Consider using `srcset` for different screen densities
   - Use Bootstrap classes: `img-fluid` for responsive images

4. **Media Queries**
   - Test layouts on mobile (320px+), tablet (768px+), desktop (1024px+)
   - Use Bootstrap breakpoints: `sm` (576px), `md` (768px), `lg` (992px), `xl` (1200px)

5. **Touch Targets**
   - Ensure clickable elements are at least 44x44 pixels for touch screens
   - Add appropriate spacing between interactive elements

### Dark/Light Mode Implementation

**The project has a complete dark/light mode system:**

1. **CSS Custom Properties (CSS Variables)**
   - Located in `public/theme.css`
   - All colors are defined as CSS variables in `:root` selector
   - Dark mode colors defined under `[data-theme="dark"]` selector
   - **When adding new styles, ALWAYS use CSS variables for colors:**
     ```css
     color: var(--text-primary);
     background-color: var(--bg-primary);
     border-color: var(--border-color);
     ```

2. **Available Theme Variables**
   - **Backgrounds**: `--bg-primary`, `--bg-secondary`, `--bg-card`
   - **Text**: `--text-primary`, `--text-secondary`, `--text-muted`
   - **Interactive**: `--link-color`, `--link-hover`, `--button-bg`, `--button-hover`
   - **Borders/Shadows**: `--border-color`, `--shadow-color`, `--shadow-hover`
   - **Alerts**: `--alert-info-bg`, `--alert-success-bg`, `--alert-warning-bg`
   - **Navigation**: `--nav-bg`, `--nav-text`

3. **Theme Toggle**
   - Implemented in `public/theme-toggle.js`
   - Automatically detects system preference via `prefers-color-scheme`
   - User preference persisted in `localStorage`
   - Loads before page render to prevent flash of wrong theme

4. **Best Practices**
   - **NEVER** hardcode colors in HTML or CSS - always use CSS variables
   - Test all new UI components in both light and dark modes
   - Ensure sufficient contrast in both themes
   - Icons and images should work in both themes (consider using CSS filters if needed)

### Google Translate Integration

**The project includes multi-language support via Google Translate:**

1. **Configuration**
   - Central config file: `public/google-translate-config.js`
   - Widget included on all pages (positioned top-right, fixed)
   - **Supported languages**: English (en), French (fr), Norwegian (no), German (de), Spanish (es), Italian (it), Portuguese (pt), Dutch (nl), Swedish (sv), Danish (da), Finnish (suomi), Polish (pl), Czech (cs), Russian (ru), Arabic (ar), Japanese (ja), Chinese Simplified (zh-CN)

2. **Implementation Pattern**
   - Widget placement: `<div id="google_translate_element"></div>`
   - Styled with `.google-translate-widget` class (fixed position, top-right)
   - Scripts loaded in HTML head:
     ```html
     <script type="text/javascript" src="/google-translate-config.js"></script>
     <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
     ```

3. **When Adding New Pages**
   - Include the translate widget container in the same fixed position
   - Import both translate scripts in the `<head>` section
   - Ensure the widget styling matches existing pages (see `index.html` styles)

4. **Content Considerations**
   - Write clear, simple content that translates well
   - Avoid idioms or culturally-specific references
   - Use proper semantic HTML (helps translation accuracy)
   - Test translated versions to ensure layout doesn't break

### Testing and Validation

**Before submitting HTML/CSS changes:**

1. **Accessibility Testing**
   - Run through keyboard navigation (Tab, Enter, Esc keys)
   - Test with screen reader (NVDA, JAWS, VoiceOver)
   - Validate HTML: Use W3C Validator or `htmllint` (configured in pre-commit hooks)
   - Check color contrast with browser DevTools or online tools

2. **Responsive Testing**
   - Test on mobile (320px), tablet (768px), desktop (1024px+)
   - Use browser DevTools device emulation
   - Test in portrait and landscape orientations
   - Verify touch targets are appropriately sized

3. **Theme Testing**
   - Toggle between light and dark modes
   - Verify all colors use CSS variables
   - Check that all text is readable in both themes
   - Ensure images/icons work in both themes

4. **Translation Testing**
   - Verify Google Translate widget appears and functions
   - Test at least 2-3 language translations
   - Check that layout remains intact when translated
   - Ensure widget is accessible and visible

5. **Browser Compatibility**
   - Test in Chrome, Firefox, Safari, and Edge
   - Verify CSS custom properties are supported (all modern browsers)
   - Check that fallbacks exist for older browsers if needed

6. **Performance**
   - Minimize CSS file sizes
   - Optimize images (use appropriate formats and compression)
   - Leverage browser caching
   - Check Lighthouse scores (aim for 90+ in Accessibility)

### HTML/CSS Code Quality Standards

1. **Code Organization**
   - Keep CSS modular and maintainable
   - Use consistent naming conventions (BEM or similar)
   - Group related styles together
   - Add comments for complex layouts or calculations

2. **CSS Best Practices**
   - Avoid `!important` unless absolutely necessary
   - Use CSS custom properties for repeated values
   - Minimize specificity conflicts
   - Prefer classes over IDs for styling
   - Use shorthand properties when appropriate

3. **HTML Best Practices**
   - Keep markup semantic and minimal
   - Avoid inline styles (use CSS classes)
   - Validate HTML with linters (htmllint, htmlhint in pre-commit hooks)
   - Use proper DOCTYPE and language declarations

4. **File Structure**
   - Main styles: `public/wireframe.css`, `public/arf.css`, `public/theme.css`
   - Theme toggle: `public/theme-toggle.js`
   - Translation config: `public/google-translate-config.js`
   - Keep related assets organized in `public/` directory

### PDF Printing Support

**All HTML pages must be print-friendly for PDF generation:**

1. **Print Stylesheets**
   - Located in `public/theme.css` and `public/wireframe.css`
   - Use `@media print` queries to define print-specific styles
   - Already implemented Bootstrap print utility classes: `.d-print-none`, `.d-print-block`, etc.

2. **Print-Specific CSS Rules**
   ```css
   @media print {
     /* Hide non-essential elements */
     nav, .google-translate-widget, .theme-toggle, footer .social-links {
       display: none !important;
     }

     /* Optimize for print */
     body {
       background: white;
       color: black;
       font-size: 12pt;
     }

     /* Prevent page breaks inside elements */
     h1, h2, h3, h4, h5, h6, p, blockquote {
       page-break-inside: avoid;
     }

     /* Show URLs for external links in print */
     a[href^='http']:after {
       content: " (" attr(href) ")";
     }
   }
   ```

3. **Print Best Practices**
   - Remove or hide: navigation menus, theme toggles, language selectors, decorative elements
   - Ensure sufficient contrast (black text on white background)
   - Use page-break properties to control pagination
   - Set appropriate margins and padding for printed pages
   - Test PDF generation using browser print preview (Chrome, Firefox)
   - Verify all important content is visible and readable when printed

4. **Bootstrap Print Utilities**
   - Use `.d-print-none` to hide elements in print view
   - Use `.d-print-block` to show elements only in print view
   - Apply to: navigation bars, theme toggles, interactive widgets

### SEO Best Practices

**All HTML pages must follow SEO best practices:**

1. **Required Meta Tags**
   ```html
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <meta name="description" content="Clear, concise description (150-160 characters)">
   <meta name="keywords" content="relevant, keywords, separated, by, commas">
   <meta name="author" content="Author name or site name">
   ```

2. **Title Tags**
   - Keep titles unique and descriptive (50-60 characters)
   - Include primary keywords
   - Format: `Primary Keyword - Secondary Keyword | Site Name`
   - Example already in use: `Missing Child - Abducted daughter by her mother and moved from France to Norway then Germany`

3. **Heading Structure**
   - Use only ONE `<h1>` per page (main topic)
   - Maintain logical hierarchy: `<h1>` → `<h2>` → `<h3>` (never skip levels)
   - Include keywords naturally in headings

4. **Content Optimization**
   - Use semantic HTML5 elements (`<article>`, `<section>`, `<nav>`, `<aside>`)
   - Write descriptive alt text for all images
   - Use descriptive anchor text for links (avoid "click here")
   - Keep URLs clean and descriptive
   - Add schema.org structured data when appropriate

5. **Performance & Core Web Vitals**
   - Optimize images (use WebP format when possible)
   - Minimize CSS and JavaScript files
   - Use lazy loading for images below the fold
   - Ensure fast loading times (aim for < 3 seconds)
   - Target Lighthouse scores: Performance (90+), SEO (95+)

6. **Mobile-First SEO**
   - Ensure mobile responsiveness (Google mobile-first indexing)
   - Test with Google Mobile-Friendly Test tool
   - Verify touch targets are appropriately sized (48x48px minimum)

### Crawler-Friendly Guidelines

**Ensure search engine crawlers can effectively index the site:**

1. **Robots.txt Configuration**
   - Located at `public/robots.txt`
   - Already configured with proper user-agent rules
   - **When modifying robots.txt:**
     - Allow legitimate search engine crawlers (Googlebot, Bingbot, etc.)
     - Block AI scrapers and unwanted bots (listed in current robots.txt)
     - Use `Crawl-delay` to prevent server overload
     - Always reference the sitemap: `Sitemap: https://dr-alban.com/sitemap-albandrieu-com.xml`
     - Submit sitemap via Google Search Console (recommended over deprecated ping service)

2. **Sitemap Requirements**
   - Reference current sitemap at `public/sitemap-albandrieu-com.xml`
   - **CRITICAL: Update sitemap when adding/removing pages**
   - Submit sitemap to Google Search Console after updates
   - Use Google Search Console for sitemap verification and monitoring

3. **Crawlability Best Practices**
   - Use semantic HTML structure (crawlers parse it better)
   - Avoid JavaScript-only navigation (use proper `<a>` tags)
   - Implement proper internal linking structure
   - Use descriptive URLs (avoid query parameters when possible)
   - Ensure all pages are reachable within 3 clicks from homepage
   - Create XML sitemap for all public pages
   - Use canonical URLs to avoid duplicate content issues

4. **Technical SEO**
   - Implement proper HTTP status codes (200, 301, 404, etc.)
   - Use 301 redirects for moved pages
   - Create custom 404 page (already exists at `public/404.html`)
   - Ensure HTTPS everywhere
   - Set proper cache headers for static assets

5. **Content Accessibility for Crawlers**
   - Use clear, descriptive link text
   - Provide alt text for all images (crawlers read these)
   - Use heading tags to structure content
   - Avoid hiding important content with CSS/JavaScript
   - Make sure primary content is in HTML, not loaded via JavaScript

### Sitemap Maintenance Guidelines

**Keep `public/sitemap-albandrieu-com.xml` up to date:**

1. **Sitemap Structure**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://dr-alban.com/path/to/page.html</loc>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
       <lastmod>YYYY-MM-DD</lastmod>
     </url>
   </urlset>
   ```

2. **When to Update Sitemap**
   - **ALWAYS** update when adding a new HTML page
   - **ALWAYS** update when removing a page
   - Update `<lastmod>` when making significant content changes
   - Update `<changefreq>` based on expected update frequency

3. **Sitemap Best Practices**
   - Include all public-facing HTML pages
   - Exclude admin pages, login pages, API endpoints
   - Use absolute URLs (include full domain)
   - Set appropriate `<priority>` values:
     - Homepage: 1.0
     - Main pages: 0.8
     - Secondary pages: 0.5
     - Archive pages: 0.3
   - Use `<changefreq>` appropriately:
     - News/blog: `daily` or `weekly`
     - Static content: `monthly` or `yearly`
     - Homepage: `weekly`

4. **Current Sitemap Pages**
   - `https://dr-alban.com/` (homepage - note: actual sitemap uses /index.html)
   - `https://dr-alban.com/policy/privacy_policy.html`
   - `https://dr-alban.com/policy/service_terms.html`
   - `https://dr-alban.com/policy/gnu_general_public_license.txt`
   - `https://status.albandrieu.com/` (external status page - note: typically external domains should not be in sitemap)

   **Note**: Consider updating the sitemap to use canonical URLs (remove /index.html for homepage) and evaluate whether external status page should be included.

5. **Sitemap Validation**
   - Validate XML structure before committing
   - Test sitemap URL is accessible: `https://dr-alban.com/sitemap-albandrieu-com.xml`
   - Submit to Google Search Console after updates
   - Verify all URLs in sitemap return HTTP 200 status
   - Keep sitemap size under 50MB and 50,000 URLs

6. **Automated Sitemap Updates**
   - Consider adding a script to auto-generate sitemap from HTML files
   - Add sitemap validation to pre-commit hooks or SDLC pipeline
   - Document sitemap update process in CONTRIBUTING.md

### Open Graph Protocol

**All HTML pages must include Open Graph meta tags for social media sharing:**

1. **Required Open Graph Tags**
   ```html
   <!-- facebook open graph tags -->
   <meta property="og:type" content="website" />
   <meta property="og:url" content="https://dr-alban.com" />
   <meta property="og:title" content="Page Title - 60 characters max" />
   <meta property="og:description" content="Clear description - 200 characters max" />
   <meta property="og:image" content="https://dr-alban.com/path/to/image.jpg" />
   <meta property="og:image:alt" content="Description of image for accessibility" />
   <meta property="og:site_name" content="Site Name" />
   <meta property="og:locale" content="en_US" />
   ```

2. **Open Graph Image Requirements**
   - Minimum size: 1200x630 pixels (recommended)
   - Aspect ratio: 1.91:1
   - Max file size: 8MB
   - Formats: JPG, PNG, WebP
   - Use absolute URLs (include full domain)
   - Ensure image is publicly accessible (not behind authentication)
   - Current example: `https://dr-alban.com/nabla/assets/miss-and-love-you-quote.jpeg`

3. **Twitter Card Tags**
   ```html
   <!-- twitter card tags additive with the og: tags -->
   <meta name="twitter:card" content="summary_large_image">
   <meta name="twitter:site" content="@username">
   <meta name="twitter:title" content="Page Title">
   <meta name="twitter:description" content="Page description">
   <meta name="twitter:image" content="https://dr-alban.com/path/to/image.jpg">
   ```

4. **Page-Specific Open Graph**
   - Customize `og:title` and `og:description` for each page
   - Use unique images for different pages when possible
   - For articles, use `og:type` = "article" and add:
     - `<meta property="article:published_time" content="YYYY-MM-DDTHH:MM:SS+00:00">`
     - `<meta property="article:author" content="Author Name">`

5. **Testing Open Graph Tags**
   - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Use Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Use LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
   - Verify images load correctly in social media previews
   - Check that titles and descriptions are properly truncated

6. **Best Practices**
   - Keep `og:title` concise and compelling (60 characters max)
   - Write engaging `og:description` (200 characters max)
   - Use high-quality, relevant images
   - Ensure Open Graph tags are in the `<head>` section
   - Update Open Graph tags when page content changes
   - Include `og:locale` for internationalization support

### Code Consistency and Reusability

**Maintain consistent, reusable code across the project:**

1. **Component-Based Approach**
   - Create reusable HTML snippets for common elements:
     - Header/navigation (consistent across all pages)
     - Footer with social links and legal info
     - Google Translate widget integration
     - Theme toggle button
     - Meta tags template
   - Use consistent class names and structure across pages
   - Document common patterns in this file

2. **CSS Architecture**
   - Follow existing file structure:
     - `wireframe.css` - Base layout and Bootstrap overrides
     - `arf.css` - Custom application styles
     - `theme.css` - Theme-specific variables and dark mode
   - Use CSS custom properties (variables) for all colors and spacing
   - Group related styles with clear comments
   - Avoid duplicating styles across files

3. **Naming Conventions**
   - Use consistent class naming (BEM methodology recommended):
     - Block: `.navigation`, `.card`, `.button`
     - Element: `.navigation__item`, `.card__title`, `.button__icon`
     - Modifier: `.button--primary`, `.card--featured`
   - Use semantic class names (`.article-header` not `.red-text`)
   - Prefix utility classes: `.u-text-center`, `.u-mb-3`

4. **Documentation Standards**
   - Add comments to complex CSS calculations or layouts
   - Document JavaScript functions and their parameters
   - Use consistent comment formatting:
     ```css
     /* ===========================================
        Section Title
        =========================================== */

     /* Subsection description */
     .class-name { }
     ```

5. **DRY Principles (Don't Repeat Yourself)**
   - Extract repeated styles into utility classes or CSS variables
   - Create reusable JavaScript functions for common tasks
   - Use template patterns for repeated HTML structures
   - Consolidate similar media queries

6. **Version Control Best Practices**
   - Make atomic commits (one logical change per commit)
   - Write clear commit messages (use commitlint format)
   - Review changes before committing to avoid accidental inclusions
   - Keep HTML, CSS, and JS changes in separate commits when possible

7. **Cross-Page Consistency Checklist**
   - [ ] Same header/navigation structure
   - [ ] Same footer content and layout
   - [ ] Same meta tags pattern (update content per page)
   - [ ] Same Google Translate integration
   - [ ] Same theme toggle implementation
   - [ ] Same CSS file imports (wireframe.css, arf.css, theme.css)
   - [ ] Same accessibility features (skip links, ARIA labels)
   - [ ] Same print stylesheet application
   - [ ] Same Open Graph/Twitter Card implementation
   - [ ] Same analytics tracking code

8. **Testing for Consistency**
   - Visually compare pages side-by-side
   - Check that theme toggle works identically across pages
   - Verify translations work on all pages
   - Ensure print preview looks consistent
   - Test responsive behavior is uniform
   - Validate all pages pass HTML/CSS linters

## Additional Quality Standards

### Security Considerations

1. **Content Security Policy**
   - Review third-party scripts carefully
   - Current integrations: Google Analytics, Google Translate, Mixpanel, VWO, PostHog
   - Only add new third-party scripts if absolutely necessary
   - Use subresource integrity (SRI) for CDN resources when possible

2. **Data Privacy**
   - Link to privacy policy: `public/policy/privacy_policy.html`
   - Ensure GDPR compliance for EU visitors
   - Document cookie usage
   - Provide opt-out mechanisms for tracking

3. **External Links**
   - Use `rel="noopener noreferrer"` for external links
   - Verify external links periodically
   - Ensure links open in appropriate context

### Performance Optimization

1. **Asset Optimization**
   - Minify CSS and JavaScript files
   - Optimize images (compress, use appropriate formats)
   - Use CDN for common libraries (Bootstrap, Font Awesome)
   - Enable browser caching via HTTP headers

2. **Loading Strategy**
   - Load critical CSS inline or in `<head>`
   - Defer non-critical JavaScript
   - Use `async` or `defer` attributes appropriately
   - Already implemented: theme-toggle.js loads early to prevent flash

3. **Lighthouse Performance Targets**
   - Performance: 90+
   - Accessibility: 95+
   - Best Practices: 95+
   - SEO: 95+

### Maintenance and Updates

1. **Regular Reviews**
   - Review and update sitemap monthly
   - Check for broken links quarterly
   - Update dependencies regularly (npm, Python packages)
   - Monitor Lighthouse scores in SDLC
   - Review robots.txt annually

2. **Content Updates**
   - Update `<lastmod>` in sitemap when content changes
   - Refresh Open Graph images if content changes significantly
   - Keep copyright year current in footer
   - Archive old content appropriately

3. **Documentation**
   - Update this file when adding new standards
   - Document any deviations from standards (with justification)
   - Keep README.md current with setup instructions
   - Update CONTRIBUTING.md with new guidelines
