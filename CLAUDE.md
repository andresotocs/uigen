# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Linting
npm run lint

# Run tests
npm run test

# Run a single test file
npx vitest run path/to/test.test.ts

# Watch mode for tests
npx vitest watch path/to/test.test.ts

# Reset database
npm run db:reset
```

## Architecture Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in chat, and the AI generates them in a virtual file system with real-time preview.

### Core Data Flow

1. **Chat API** (`src/app/api/chat/route.ts`) - Receives user messages, streams AI responses using Vercel AI SDK
2. **Virtual File System** (`src/lib/file-system.ts`) - In-memory file system that stores generated components (no files written to disk)
3. **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) - Transforms JSX/TSX to ES modules using Babel, creates blob URLs for import maps
4. **Preview Frame** (`src/components/preview/PreviewFrame.tsx`) - Sandboxed iframe that renders components using ESM import maps

### AI Tool System

The AI uses two tools to manipulate the virtual file system:

- **str_replace_editor** (`src/lib/tools/str-replace.ts`) - Create files, replace strings, insert text at line numbers
- **file_manager** (`src/lib/tools/file-manager.ts`) - Rename and delete files/directories

### Context Providers

- **FileSystemProvider** (`src/lib/contexts/file-system-context.tsx`) - Manages virtual file system state, handles tool call side effects, provides `refreshTrigger` counter that increments on changes
- **ChatProvider** (`src/lib/contexts/chat-context.tsx`) - Wraps Vercel AI SDK's useChat, syncs file system with API requests, delegates tool calls to FileSystemProvider

### Live Preview Pipeline

1. Files are transformed via Babel (JSX to JS, TypeScript stripped)
2. Each transformed file becomes a blob URL
3. Import map is generated mapping paths to blob URLs (including `@/` aliases)
4. Third-party imports resolve to esm.sh CDN
5. Preview HTML loads via iframe srcdoc with import map

### Mock Provider

When `ANTHROPIC_API_KEY` is not set, `src/lib/provider.ts` uses a `MockLanguageModel` that returns static component examples. This allows the app to run without an API key.

## Key Patterns

- Path alias `@/*` maps to `./src/*` in Next.js config
- Virtual file paths start with `/` (e.g., `/App.jsx`, `/components/Button.jsx`)
- Entry point detection: looks for `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx` in that order
- CSS imports in generated components are extracted and injected as `<style>` tags
- Third-party imports (e.g., `react`, `lucide-react`) resolve to esm.sh CDN
- Prisma client is generated to `src/generated/prisma/`
- Virtual file system serializes to `Record<string, FileNode>` for API transport
- Preview updates via `refreshTrigger` pattern (incrementing counter)

## Database

The database schema is defined in the `prisma/schema.prisma` file. Reference it anytime you need to understand the structure of data stored in the database.

## Code Style

- Use comments sparingly. Only comment complex code.
