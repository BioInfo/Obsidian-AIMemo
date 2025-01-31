# Contributing to Obsidian AI Voice Memo Plugin

Thank you for your interest in contributing to the Obsidian AI Voice Memo Plugin! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Development Process

### Setting Up Development Environment

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Building and Testing

1. Build the plugin:
   ```bash
   npm run build
   ```

2. For development with hot-reload:
   ```bash
   npm run dev
   ```

3. Test your changes thoroughly before submitting

### TypeScript Guidelines

- Use strict mode
- No `any` types
- Prefer interfaces over types for object definitions
- Document public APIs with JSDoc comments
- Follow existing code style

### Project Structure

```
src/
├── components/     # UI components
├── managers/      # Core functionality managers
├── services/      # External service integrations
├── types/         # TypeScript type definitions
└── utils/         # Utility functions and helpers
```

## Pull Request Process

1. **Branch Naming**
   - `feature/` for new features
   - `fix/` for bug fixes
   - `docs/` for documentation changes
   - `refactor/` for code improvements

2. **Commit Messages**
   - Use clear, descriptive commit messages
   - Start with a verb (add, fix, update, etc.)
   - Reference issues when applicable

3. **Pull Request Template**
   ```markdown
   ## Description
   [Describe your changes]

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing
   [Describe how you tested your changes]

   ## Related Issues
   [Link any related issues]
   ```

4. **Code Review Process**
   - All submissions require review
   - Address review feedback promptly
   - Keep discussions constructive

## Testing Guidelines

1. **Unit Tests**
   - Write tests for new functionality
   - Maintain existing test coverage
   - Use meaningful test descriptions

2. **Manual Testing**
   - Test on both desktop and mobile
   - Verify with different Obsidian themes
   - Check performance impact

## Documentation

1. **Code Documentation**
   - Use JSDoc for public APIs
   - Include usage examples
   - Document complex algorithms

2. **User Documentation**
   - Update README.md for new features
   - Maintain clear usage instructions
   - Include screenshots when helpful

## Release Process

1. Version numbers follow [SemVer](https://semver.org/)
2. Update CHANGELOG.md with changes
3. Tag releases appropriately
4. Update documentation as needed

## Getting Help

- Create an issue for bugs or feature requests
- Join discussions in existing issues
- Check the documentation first

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
