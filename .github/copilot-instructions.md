# GitHub Copilot Instructions - Nabla Site Apache

## Project Overview
This is an HTML project for Nabla company that promotes DevSecOps expertise. All code changes must maintain consistency with existing patterns and follow these standards.

## HTML Project Standards

### 1. Accessibility (WCAG AA Compliance)
**REQUIRED**: All HTML must meet WCAG 2.1 Level AA standards.

- **Semantic HTML**: Use proper HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`, `<aside>`)
- **Alt Text**: All images must have descriptive `alt` attributes. Decorative images should use `alt=""`
- **ARIA Labels**: Use ARIA attributes when semantic HTML is insufficient
  - Add `aria-label` or `aria-labelledby` to interactive elements without visible text
  - Use `role` attributes only when semantic HTML is not available
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
  - Ensure logical tab order with proper use of `tabindex` (prefer `tabindex="0"` or native tabbing)
  - Focus indicators must be visible (never use `outline: none` without providing alternative focus styles)
- **Color Contrast**: Ensure minimum 4.5:1 contrast ratio for normal text, 3:1 for large text
- **Form Accessibility**:
  - Every `<input>` must have an associated `<label>` using `for` attribute
  - Use `<fieldset>` and `<legend>` for grouped form controls
  - Provide clear error messages with `aria-describedby`
- **Skip Links**: Include skip navigation links for keyboard users
- **Language Attributes**: Set `lang` attribute on `<html>` tag and use on elements with different languages

### 2. Responsive Design
**REQUIRED**: All pages must be mobile-first and responsive.

- **Mobile-First Approach**: Design for mobile first, then enhance for larger screens
- **Viewport Meta Tag**: Always include `<meta name="viewport" content="width=device-width, initial-scale=1" />`
- **Responsive Images**: Use responsive image techniques
  - `srcset` and `sizes` attributes for different resolutions
  - `<picture>` element for art direction
- **Media Queries**: Define breakpoints in CSS
  - Mobile: < 576px
  - Tablet: 576px - 768px
  - Desktop: 768px - 1200px
  - Large Desktop: > 1200px
- **Flexible Layouts**: Use CSS Grid or Flexbox for layouts, avoid fixed pixel widths
- **Touch-Friendly**: Interactive elements must be at least 44x44px for touch targets
- **Test on Multiple Devices**: Verify responsive behavior across devices

### 3. Theme Support (Light/Dark Mode)
**REQUIRED**: Maintain existing theme implementation in `public/theme.css`.

- **Theme Detection**: Use `data-theme` attribute on `<html>` element
  - Detect system preference: `prefers-color-scheme` media query
  - Allow manual theme toggle with theme switcher button
- **CSS Variables**: Define theme colors using CSS custom properties
  ```css
  html[data-theme="light"] {
    --bg-color: #ffffff;
    --text-color: #000000;
  }
  html[data-theme="dark"] {
    --bg-color: #000000;
    --text-color: #ffffff;
  }
  ```
- **Theme Toggle Button**: Include accessible theme toggle with proper ARIA labels
- **Persistence**: Save user preference in `localStorage`
- **Print Styles**: Theme should not affect print output (see Print Styles section)

### 4. Internationalization (i18n)
**REQUIRED**: Prepare all content for internationalization.

- **Language Attribute**: Always set `lang` attribute on `<html>` tag (e.g., `lang="en"`)
- **Content Structure**: Separate content from structure
  - Consider using data attributes or JSON for translatable strings
  - Avoid hardcoding text in JavaScript
- **Direction Support**: Plan for RTL (right-to-left) languages
  - Use logical properties (`inline-start`, `inline-end`) instead of left/right
- **Date/Time Formatting**: Use `Intl.DateTimeFormat` for dates and times
- **Number Formatting**: Use `Intl.NumberFormat` for numbers
- **Text Expansion**: Design UI with text expansion in mind (30-40% more space for translations)
- **Language Switcher**: Include language selection functionality when multiple languages are supported

### 5. PDF Printing
**REQUIRED**: Maintain print styles in `public/print.css`.

- **Print Media Query**: Use `@media print` for print-specific styles
- **Print Stylesheet**: Link print stylesheet: `<link rel="stylesheet" href="public/print.css" media="print" />`
- **Print Optimization**:
  - Hide unnecessary elements (navigation, footers, ads) using `display: none`
  - Remove background colors/images to save ink
  - Use black text on white background
  - Set appropriate page breaks using `page-break-before`, `page-break-after`, `page-break-inside`
  - Expand URLs in links using CSS: `a[href]:after { content: " (" attr(href) ")"; }`
- **Page Size**: Define page size if needed: `@page { size: A4; margin: 2cm; }`
- **Print Button**: Consider adding a print button with `onclick="window.print()"`

### 6. SEO (Search Engine Optimization)
**REQUIRED**: All pages must be optimized for search engines.

- **Title Tags**: Unique, descriptive `<title>` for each page (50-60 characters)
- **Meta Description**: Include compelling meta description (150-160 characters)
  ```html
  <meta name="description" content="Your page description here" />
  ```
- **Meta Keywords**: Optional but can include relevant keywords
  ```html
  <meta name="keywords" content="keyword1, keyword2, keyword3" />
  ```
- **Heading Structure**: Proper heading hierarchy (one `<h1>` per page, then `<h2>`, `<h3>`, etc.)
- **Semantic HTML**: Use semantic elements for better content understanding
- **Canonical URLs**: Specify canonical URL to avoid duplicate content
  ```html
  <link rel="canonical" href="https://dr-alban.com/page.html" />
  ```
- **Structured Data**: Use JSON-LD for structured data when appropriate
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Alban Andrieu"
  }
  </script>
  ```
- **URL Structure**: Use clean, descriptive URLs
- **Image Optimization**: Optimize image file sizes and use descriptive filenames
- **Internal Linking**: Use descriptive anchor text for internal links
- **Meta Author**: Include author information
  ```html
  <meta name="author" content="alban.andrieu@dr-alban.com" />
  ```

### 7. Crawler Friendly
**REQUIRED**: Maintain `public/robots.txt` with crawler rules.

- **robots.txt**: Keep `public/robots.txt` updated with proper directives
  - Allow legitimate search engine crawlers
  - Block AI bots and scrapers as configured
  - Include `Sitemap:` directive pointing to sitemap
  - Use `Crawl-delay` for rate limiting
- **Meta Robots**: Use meta robots tag when needed
  ```html
  <meta name="robots" content="index, follow" />
  <!-- Or for pages that shouldn't be indexed: -->
  <meta name="robots" content="noindex, nofollow" />
  ```
- **Clean HTML**: Use valid, well-structured HTML
- **Fast Loading**: Optimize page load speed (< 3 seconds)
- **Mobile-Friendly**: Ensure mobile responsiveness (crawler requirement)
- **HTTPS**: Use HTTPS (already enforced by deployment platform)
- **Avoid JavaScript-Only Content**: Ensure critical content is in HTML, not rendered only by JavaScript

### 8. Sitemap Maintenance
**REQUIRED**: Keep `public/sitemap-albandrieu-com.xml` up to date.

- **Update Sitemap**: When adding/removing/moving pages, update `public/sitemap-albandrieu-com.xml`
- **Sitemap Format**: Follow XML sitemap protocol (http://www.sitemaps.org/schemas/sitemap/0.9)
  - Note: The xmlns namespace URL uses `http://` as per official specification, even for HTTPS sites
- **Include All Pages**: List all public HTML pages
- **Change Frequency**: Set appropriate `<changefreq>` (always, hourly, daily, weekly, monthly, yearly, never)
- **Priority**: Use `<priority>` (0.0-1.0) to indicate relative importance (optional)
- **Last Modified**: Include `<lastmod>` with ISO 8601 date format when possible
- **Submit to Search Engines**: After updates, ping search engines
  ```bash
  curl "https://www.google.com/ping?sitemap=https://dr-alban.com/sitemap-albandrieu-com.xml"
  ```
- **Sitemap in robots.txt**: Ensure sitemap URL is in robots.txt (already configured)

### 9. Open Graph Protocol
**REQUIRED**: Add Open Graph meta tags to all pages for social media sharing.

- **Essential OG Tags**: Include these on every page
  ```html
  <meta property="og:title" content="Page Title" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://dr-alban.com/page.html" />
  <meta property="og:image" content="https://dr-alban.com/assets/nabla/nabla-4.png" />
  <meta property="og:description" content="Page description for social sharing" />
  <meta property="og:site_name" content="Nabla - Alban Andrieu" />
  ```
- **Image Requirements**:
  - Minimum size: 1200x630px (recommended)
  - Aspect ratio: 1.91:1
  - Format: JPG or PNG
  - Include `og:image:width` and `og:image:height`
- **Twitter Cards**: Add Twitter-specific tags for better Twitter sharing
  ```html
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@username" />
  <meta name="twitter:title" content="Page Title" />
  <meta name="twitter:description" content="Description" />
  <meta name="twitter:image" content="https://dr-alban.com/image.png" />
  ```
- **Type-Specific Properties**: Use appropriate `og:type` (website, article, profile, etc.)
- **Locale**: Specify content locale
  ```html
  <meta property="og:locale" content="en_US" />
  ```
- **Test OG Tags**: Verify with Facebook's Sharing Debugger and Twitter Card Validator

### 10. Code Consistency and Reusability

#### HTML Standards
- **DOCTYPE**: Always use `<!doctype html>` for HTML5
- **Indentation**: Use 2 spaces for indentation (consistent with existing code)
- **Closing Tags**: Always close tags properly
- **Lowercase**: Use lowercase for element names and attributes
- **Quotes**: Use double quotes for attribute values
- **Comments**: Add meaningful HTML comments for complex sections
  ```html
  <!-- Main Navigation -->
  <nav>...</nav>
  ```

#### CSS Standards
- **Organization**: Keep related styles together
- **Naming Convention**: Use kebab-case for class names (e.g., `main-header`, `nav-item`)
- **Reusable Classes**: Create utility classes for common patterns
- **CSS Variables**: Use CSS custom properties for theme values and repeated values
- **Mobile First**: Write mobile styles first, then use min-width media queries
- **Avoid !important**: Use specific selectors instead of `!important`
- **Component-Based**: Organize CSS by component/section

#### JavaScript Standards
- **Modern JavaScript**: Use ES6+ features
- **Async/Await**: Prefer async/await over promises chains
- **Constants**: Use `const` by default, `let` when reassignment is needed, avoid `var`
- **Template Literals**: Use template literals for string interpolation
- **Arrow Functions**: Use arrow functions for callbacks
- **Error Handling**: Always include error handling for async operations

#### File Organization
- **Assets**: Keep all assets in `public/assets/` directory
- **CSS**: Place stylesheets in `public/` or `public/assets/css/`
- **JavaScript**: Place scripts in `public/assets/js/` when needed
- **Images**: Optimize and place in `public/assets/images/` or subdirectories
- **Naming**: Use descriptive, lowercase filenames with hyphens (e.g., `privacy-policy.html`)

#### Component Reusability
- **DRY Principle**: Don't Repeat Yourself - extract common patterns
- **Partial Templates**: Consider extracting reusable HTML sections
- **CSS Components**: Create reusable CSS components (buttons, cards, etc.)
- **JS Modules**: Create reusable JavaScript functions and modules

#### Documentation
- **Code Comments**: Document complex logic and non-obvious decisions
- **README**: Update README.md when adding new features or changing structure
- **Inline Documentation**: Use JSDoc for JavaScript functions
- **CSS Comments**: Document complex CSS with comments

#### Performance
- **Minification**: Minify CSS and JavaScript for production
- **Image Optimization**: Compress and optimize images
- **Lazy Loading**: Use lazy loading for images below the fold
- **CDN**: Use CDN for common libraries (Font Awesome, etc.)
- **Critical CSS**: Inline critical CSS, defer non-critical styles
- **Defer Scripts**: Use `defer` or `async` for script loading

#### Testing and Validation
- **HTML Validation**: Validate HTML using W3C Validator
- **CSS Validation**: Validate CSS using W3C CSS Validator
- **Accessibility Testing**: Test with screen readers and accessibility tools
- **Browser Testing**: Test across major browsers (Chrome, Firefox, Safari, Edge)
- **Responsive Testing**: Test on various device sizes
- **Performance Testing**: Use Lighthouse or similar tools

## Git and Deployment Standards

### Commit Messages
- Use conventional commit format
- Be descriptive and specific
- Reference issue numbers when applicable

### Branch Strategy
- Work on feature branches
- Keep commits focused and atomic
- Test before pushing

### Deployment
- Test locally before deployment
- Update sitemap when adding/removing pages
- Verify all links work after deployment
- Check robots.txt accessibility

## Quick Reference Checklist

When creating or modifying HTML pages, ensure:

- [ ] HTML5 semantic elements used properly
- [ ] WCAG AA accessibility requirements met (alt text, ARIA labels, keyboard navigation, color contrast)
- [ ] Responsive design with mobile-first approach
- [ ] Theme support (light/dark mode) using CSS variables
- [ ] i18n considerations (lang attribute, content structure)
- [ ] Print styles defined in print.css
- [ ] SEO meta tags (title, description, keywords, author)
- [ ] Open Graph meta tags for social sharing
- [ ] Crawler-friendly (clean HTML, fast loading, proper robots meta)
- [ ] Sitemap updated with new/changed pages
- [ ] Code follows project conventions (indentation, naming, organization)
- [ ] Images optimized and have alt text
- [ ] Links tested and functional
- [ ] Validated with W3C HTML and CSS validators
- [ ] Tested across browsers and devices
- [ ] Performance optimized (lazy loading, minification, CDN usage)

## Contact
For questions or clarifications, contact: alban.andrieu@dr-alban.com
