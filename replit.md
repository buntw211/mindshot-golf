# MindShot Golf - Mental Game Journal

## Overview

MindShot Golf is a mental game journaling application for golfers. It helps players track their thoughts, emotions, and mental patterns during rounds and practice sessions. The app provides structured journaling with guided questions, pattern analysis, and mental game tips to help golfers develop stronger psychological approaches to their game.

Key features:
- Journal entries for rounds (play) and practice sessions
- Thought categorization across mental game dimensions (confidence, focus, frustration, etc.)
- Pattern analysis to identify recurring mental tendencies
- Dashboard with session statistics and insights
- Mental game tips and cognitive reframing suggestions
- Self-assessment ratings with comparison to journal analysis
- Scorecard photo upload for future reference

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode with golf-themed green color palette)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Authentication**: Replit OIDC Auth
- **Development**: Vite middleware for HMR in development, static file serving in production

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Shared schema definitions in `shared/schema.ts` using Drizzle's table definitions
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`
- **Migrations**: Drizzle Kit for schema management (`db:push` command)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components (shadcn/ui)
│       ├── pages/       # Route components
│       ├── hooks/       # Custom React hooks
│       └── lib/         # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema and types
└── migrations/       # Database migrations
```

### Key Design Decisions
- **Monorepo structure**: Single repository with shared types between frontend and backend
- **Type safety**: Full TypeScript coverage with shared Zod schemas for runtime validation
- **Component library**: shadcn/ui provides accessible, customizable components without vendor lock-in
- **Session-based data model**: Sessions (rounds or practice) contain thoughts, each categorized by mental game dimension

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Connection**: pg (node-postgres) pool with Drizzle ORM wrapper

### UI/Component Libraries
- **Radix UI**: Headless accessible component primitives
- **shadcn/ui**: Pre-built component implementations
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **Tailwind CSS**: Utility-first CSS with PostCSS

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation (shared between client/server)
- **@hookform/resolvers**: Zod integration with React Hook Form

### Data Fetching
- **TanStack Query**: Server state management with caching and refetching

### Date Handling
- **date-fns**: Date formatting and manipulation

## Recent Changes

- 2026-02-24: Removed in-app purchases (Stripe subscription system). All features are now free and unlimited.
