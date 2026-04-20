# Static Directory

This directory contains static assets that Hugo copies directly to the output without processing.

## Usage

Files in this directory are copied to the root of the generated site:

```
static/
├── css/
├── js/
├── images/
└── favicon.ico
```

Becomes:

```
public/
├── css/
├── js/
├── images/
└── favicon.ico
```

## Migration Note

During migration, assets from `public/assets/` will be moved here to be managed by Hugo's build process.
