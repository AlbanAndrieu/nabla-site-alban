# Contributing to this repo

Thank you for your interest in contributing to nabla-site-alban! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/AlbanAndrieu/nabla-site-alban.git
   cd nabla-site-alban
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

## Development Workflow

> **Never push or write directly to `master`.** All changes, including documentation-only and trivial fixes, must be made on a non-default branch and integrated through a pull request. Automated agents must also specify an explicit non-default branch for every remote write and must never force-update `master`.

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes**:
   ```bash
   # Run linting
   npm run lint

   # Test locally
   npm run start
   ```

4. **Commit your changes** using conventional commit format:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update README"
   ```

5. **Push the non-default branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub targeting `master`

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes
- `build:` - Build system changes
- `perf:` - Performance improvements
- `revert:` - Reverting previous commits

## Code Style

- Follow the [EditorConfig](.editorconfig) settings
- Run `npm run lint` before committing
- Use tabs for indentation in JavaScript/TypeScript files
- Add comments for complex logic
- Keep functions small and focused

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README.md if you've made significant changes
4. Request review from maintainers
5. Address any review feedback

## Project Structure

```
nabla-site-alban/
├── public/              # Static website files (main site)
├── my-app/              # Next.js application
├── api/                 # API functions
└── .github/             # GitHub workflows and configurations
```

## Testing

Before submitting a PR:

1. **Lint your code**:
   ```bash
   npm run lint
   ```

2. **Test locally**:
   ```bash
   # Using Cloudflare Wrangler
   npm run start

   # Or using Python
   npm run start-python
   ```

3. **Check for security vulnerabilities**:
   ```bash
   npm audit
   ```

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Screenshots (if applicable)

## Questions?

If you have questions, please:
1. Check existing issues and documentation
2. Open a new issue with your question
3. Be clear and provide context

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

Thank you for contributing! 🎉
