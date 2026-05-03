# CV Subsystem Runbook

This document covers the `public/cv/` subsystem used to publish the multilingual
HTML and PDF resume pages.

## 01 Intent and Scope

The CV subsystem publishes:

- the landing page at `/cv/index.html`
- language-specific HTML CV pages (small, medium, large)
- LaTeX-generated PDF CVs for standard and `-ts` variants
- machine-readable resume data in `schema.json`

This subsystem is static and is served directly from `public/`.

## 02 Codepaths and File Map

Core files in `public/cv/`:

- `index.html`: CV landing page and primary links
- `cv-small-{en,fr,de,no}.html`
- `cv-medium-{en,fr,de,no}.html`
- `cv-large-{en,fr,de,no}.html`
- `cv-full-{en,fr,de,no}.html` (present in repository, not linked from landing page)
- `cv-aandrieu-2026-{en,fr,de,no}.tex`
- `cv-aandrieu-2026-ts-{en,fr,de,no}.tex`
- `schema.json`: JSON resume data
- `cv-theme.css`: shared CV styling tokens and theme values

Cross-directory dependencies:

- `public/cv-markdown-export.js`
- `public/print-menu.js`
- root `Makefile` target `build-pdf`
- CI workflow `.github/workflows/build-pdf.yml`

## 03 Output Variants

HTML variants currently linked from `index.html`:

- small: EN, FR, DE, NO
- medium: EN, FR, DE, NO
- large: EN, FR, DE, NO

PDF variants currently linked from `index.html`:

- standard: `cv-aandrieu-2026-{lang}.pdf`
- 20-second style: `cv-aandrieu-2026-ts-{lang}.pdf`

## 04 Local Development Workflow

### 04.01 Preview CV pages locally

From repository root:

```bash
npm run start-python
```

Open:

- `http://localhost:8001/cv/index.html`

### 04.02 Build PDFs locally

From repository root:

```bash
make build-pdf
```

Equivalent build pattern used by the Makefile:

```bash
latexmk -pdflua ./public/cv/cv-aandrieu-2026-*.tex -aux-directory=./public/cv -output-directory=./public/cv
```

### 04.03 Optional HTML export from LaTeX

For ad-hoc LaTeX-to-HTML conversion:

```bash
htlatex cv-aandrieu-2026-en.tex html "" -dSomeDir "--interaction=nonstopmode -shell-escape"
```

### 04.04 Optional Word export from LaTeX

For ad-hoc LaTeX-to-Word conversion:

```bash
pandoc -s cv-aandrieu-2026-ts-fr.tex -o cv-aandrieu-2026-ts.docx
```

## 05 CI Workflow

CI builds all eight PDF variants in `.github/workflows/build-pdf.yml` and uploads:

- artifact `cv-pdfs`: generated PDFs
- artifact `cv-logs`: LaTeX logs

The workflow uses:

```bash
sudo apt install texlive-full fonts-font-awesome
```

If local PDF builds fail due to missing packages, match that dependency set.

## 06 Update Checklist

When editing CV content, keep these files in sync:

1. `index.html` links and labels.
2. HTML CV pages for all language/size variants affected by the change.
3. `schema.json` basics/profiles/skills when resume facts change.
4. `.tex` sources if PDF exports must reflect the same update.

Run a local pass before merge:

1. Preview `/cv/index.html` and open each changed link.
2. Build PDFs with `make build-pdf`.
3. Confirm generated PDF names still match links in `index.html`.

## 07 Common Pitfalls and Troubleshooting

### 07.01 Broken CV links

Symptom: button on `index.html` returns `404`.

Check:

- filename pattern in `public/cv/`
- exact href in `index.html`
- language suffix consistency (`en`, `fr`, `de`, `no`)

### 07.02 HTML/PDF drift

Symptom: details differ between HTML pages and PDF exports.

Cause: edits made only in `.html` or only in `.tex`.

Fix: update both representations when the same information is expected in both.

### 07.03 Metadata domain mismatch

Some CV pages still include metadata URLs on `albandrieu.com` while canonical
links now generally use `dr-alban.com`. Keep metadata domains consistent when
touching page head tags.

### 07.04 Resume schema drift

Symptom: crawlers read outdated profile data.

Cause: `schema.json` not updated after CV content changes.

Fix: update `schema.json` together with content updates.
