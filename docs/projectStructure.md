# Project Structure Guide

## Directory Layout

```
obsidian-aimemo/
├── src/                      # Source code directory
│   ├── main.ts              # Main plugin entry point
│   ├── managers/            # Business logic managers
│   │   ├── voice-recorder-manager.ts
│   │   └── ...
│   ├── components/          # UI components
│   │   └── ...
│   ├── services/           # External service integrations
│   │   └── ...
│   ├── types/              # TypeScript type definitions
│   │   ├── settings.ts
│   │   └── ...
│   └── utils/              # Utility functions and helpers
├── docs/                   # Project documentation
├── styles.css             # Plugin styles
├── manifest.json          # Plugin manifest
├── package.json           # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## Key Conventions

1. **Source Organization**
   - All TypeScript source files go in the `src/` directory
   - Use kebab-case for file names (e.g., `voice-recorder-manager.ts`)
   - Use PascalCase for class names and interfaces
   - Use camelCase for variables and functions

2. **Module Structure**
   - `managers/`: Business logic and state management
   - `components/`: UI-related code and views
   - `services/`: External integrations (API clients, etc.)
   - `types/`: TypeScript interfaces and types
   - `utils/`: Helper functions and utilities

3. **Main Entry Point**
   - `src/main.ts` is the primary plugin entry point
   - Contains the main plugin class and initialization
   - Coordinates between managers and components

4. **Documentation**
   - Keep documentation up-to-date in the `docs/` directory
   - Use markdown for all documentation files
   - Include code examples where relevant

## Best Practices

1. **Code Organization**
   - One class per file
   - Group related functionality in appropriate directories
   - Keep files focused and manageable in size

2. **TypeScript Usage**
   - Use strict mode
   - Prefer interfaces over types
   - Explicit return types on public methods
   - No `any` types

3. **State Management**
   - Centralize state in manager classes
   - Use TypeScript interfaces for state definitions
   - Implement proper cleanup in `onunload()`

4. **Error Handling**
   - Use try-catch blocks for error-prone operations
   - Provide user feedback via `Notice`
   - Log errors appropriately

## Building and Testing

1. **Development**
   - Use `npm run dev` for development
   - Changes hot-reload in Obsidian

2. **Production**
   - Use `npm run build` for production builds
   - Verify the build before releasing

3. **Testing**
   - Add tests in `__tests__` directory
   - Follow test naming convention: `*.test.ts`
