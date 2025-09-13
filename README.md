# RS Planner - TypeScript Monorepo

A TypeScript monorepo for RuneScape planning tools and utilities.

## Project Structure

```
rs-planner/
├── core/                   # Shared domain logic and utilities
│   ├── src/
│   │   └── index.ts       # Main library exports
│   ├── package.json
│   └── tsconfig.json
├── data/                   # JSON configuration and data files
│   ├── skills.json        # Game skills data
│   └── woodcutting.json   # Woodcutting items data
├── scripts/                # Node.js scripts for data synchronization
│   ├── src/
│   │   └── sync-data.ts   # Data sync utility
│   ├── package.json
│   └── tsconfig.json
├── cli/                    # Command-line interface for testing
│   ├── src/
│   │   └── index.ts       # CLI entry point
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   └── copilot-instructions.md
├── package.json            # Root package.json with workspace config
├── tsconfig.json          # Root TypeScript configuration
└── README.md              # This file
```

## Quick Start

### Installation
```bash
npm install
```

### Build All Workspaces
```bash
npm run build
```

### Run the CLI
```bash
cd cli
npm start

# Or run with commands
npm start test
```

### Run Data Sync Scripts
```bash
cd scripts
npm run sync-data all
```

## Workspace Details

### `core/` - Shared Library
Contains domain logic and utilities that can be shared across all apps:
- `greet()` - Simple greeting function
- `calculateXpForLevel()` - RuneScape XP calculations
- `loadGameData()` - Utility to load JSON data files

**Development:**
```bash
cd core
npm run build      # Build once
npm run dev        # Watch mode
npm run clean      # Clean build artifacts
```

### `data/` - Game Data
Contains JSON files with game data:
- `skills.json` - List of RuneScape skills
- `woodcutting.json` - Woodcutting items and XP values

Add new data files here and use `loadGameData()` from the core to load them.

### `scripts/` - Data Sync Scripts
Node.js scripts for synchronizing data with external sources:
- `sync-data.ts` - Main sync script

**Usage:**
```bash
cd scripts
npm run build
npm run sync-data all      # Sync all data
npm run sync-data skills   # Sync skills only
npm run sync-data items    # Sync items only
```

### `cli/` - Command Line Interface
Simple CLI app for testing library functionality:

**Usage:**
```bash
cd cli
npm run build
npm start           # Show help
npm start test      # Run test functionality
```

## Development Workflow

1. **Make changes to the `core/`** - Add your domain logic here
2. **Update data in `data/`** - Add JSON files as needed
3. **Create sync scripts in `scripts/`** - To keep data up to date
4. **Test with the `cli/`** - Use the CLI to test your functionality

### Building Everything
```bash
npm run build       # Build all workspaces
```

### Cleaning Everything
```bash
npm run clean       # Clean all workspaces
```

## TypeScript Configuration

The project uses TypeScript project references for:
- Fast incremental builds
- Better IDE support
- Clear dependency relationships

Each workspace has its own `tsconfig.json` that references the shared `core` workspace.

## Adding New Workspaces

1. Create a new folder in the root
2. Add a `package.json` with workspace-specific configuration
3. Add a `tsconfig.json` that references `../core` if needed
4. Update the root `package.json` workspaces array
5. Update the root `tsconfig.json` references array

## Available Scripts (Root Level)

- `npm run build` - Build all workspaces
- `npm run clean` - Clean all workspaces  
- `npm run test` - Run tests in all workspaces
- `npm run dev` - Start dev mode in all workspaces

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
