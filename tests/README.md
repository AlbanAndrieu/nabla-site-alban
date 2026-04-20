# Playwright Tests

This directory contains end-to-end tests using [Playwright](https://playwright.dev/).

## Test Structure

- `homepage.spec.ts` - Tests for the homepage including meta tags and basic structure
- `404.spec.ts` - Tests for the 404 error page
- `theme-toggle.spec.ts` - Tests for dark/light theme switching
- `google-translate.spec.ts` - Tests for Google Translate widget functionality
- `accessibility.spec.ts` - Tests for accessibility features (WCAG compliance, ARIA, keyboard navigation, etc.)
- `responsive.spec.ts` - Tests for responsive design across different viewports
- `navigation.spec.ts` - Tests for links, navigation, and routing
- `site-analytics.spec.ts` - Tests analytics script wiring and mode-based loaders
- `site-widgets.spec.ts` - Tests shared widget runtime behavior and data-attribute toggles
- `expertise.spec.ts` - Tests expertise page structure and key content sections
- `startup.spec.ts` - Tests startup page copy and basic rendering paths

## Known Coverage Gap

Checkout pages (`/checkout.html`, `/success.html`, `/cancel.html`) are not covered by Playwright yet. The Stripe flow needs `npm run start:stripe` (see `server.cjs` and `docs/checkout-support-runbook.md`) running alongside the site for full end-to-end payment tests.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see the browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

## Writing New Tests

### Basic Test Structure

To add new tests, create a new file with the `.spec.ts` extension in this directory:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // Navigate to page
    await page.goto('/');

    // Perform actions and assertions
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use descriptive test names** - Describe what the test validates, make it clear what each test is checking
2. **Test user behavior** - Focus on what users see and interact with the site, not implementation details
3. **Keep tests independent** - Each test should be able to run on its own
4. **Use appropriate selectors** - Prefer accessible selectors (role, label) over CSS
5. **Wait for elements** - Playwright auto-waits, but use `waitForLoadState` when needed
6. **Use page objects for complex pages** - Extract common page interactions into reusable functions
7. **Test responsive design** - Tests run on multiple viewports (desktop and mobile)
8. **Check accessibility** - Ensure all features are keyboard-accessible and screen-reader friendly, include ARIA labels, keyboard navigation, etc.

### Common Patterns

#### Testing visibility
```typescript
await expect(page.locator('nav')).toBeVisible();
```

#### Testing text content
```typescript
await expect(page.locator('h1')).toContainText(/Expected Text/i);
```

#### Testing attributes
```typescript
const alt = await page.locator('img').getAttribute('alt');
expect(alt).toBeTruthy();
```

#### Testing for meta tags (SEO)
```typescript
const description = await page.locator('meta[name="description"]').getAttribute('content');
expect(description).toBeTruthy();
```

#### Testing responsive behavior
```typescript
test('should work on mobile', async ({ page, viewport }) => {
  await page.goto('/');

  if (viewport && viewport.width < 768) {
    // Mobile-specific assertions
  }
});
```

#### Testing theme or state changes
```typescript
const button = page.locator('.theme-toggle');
await button.click();
await page.waitForTimeout(300); // Allow animation
const theme = await page.locator('html').getAttribute('data-theme');
expect(theme).toBe('dark');
```

## Configuration

Test configuration is in `playwright.config.ts` in the root directory:

- **Base URL**: `http://localhost:8001` (Python static server by default)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Auto-start server**: Tests run `npm run start-python` automatically
- **Retries on CI**: 2 retries on failure in CI environment
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

## Debugging

### Debug Mode
```bash
npm run test:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- See locator highlights
- Edit locators
- View console logs

### Headed Mode
```bash
npm run test:headed
```

Runs tests with a visible browser window.

### UI Mode
```bash
npm run test:ui
```

Opens an interactive UI to run and debug tests with time-travel debugging.
## CI/CD Integration

Tests run automatically on GitHub Actions for:
- Pushes to `main`, `master`, and `develop`
- Pull requests to `main`, `master`, and `develop`

See `.github/workflows/playwright.yml` for the workflow configuration.

Test reports and results are uploaded as artifacts and retained for 30 days.

Note on Node versions:
- Local engines in `package.json` target newer Node (`>=24.11.0`), while the Playwright CI workflow currently runs Node `20`. If tests behave differently, reproduce with both versions.

## Troubleshooting

### Tests fail locally but pass in CI
- Ensure browsers are installed: `npx playwright install --with-deps`
- Check that `npm run start-python` serves `public/` on port `8001`

### Flaky tests
- Increase wait times for slow animations
- Use `waitForLoadState('networkidle')` for pages with async loading
- Add retries to the test configuration

### Element not found
- Use Playwright Inspector to find correct selectors
- Check if element is created dynamically (wait for it)
- Verify element exists on the page you're testing

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
