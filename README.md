# 10x Flashcard Builder

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

An AI-powered web application designed to aid the way you study. 10x Flashcard Builder reduces the time and cognitive effort required to create high-quality study materials by leveraging Large Language Models (LLMs) to automatically generate flashcards from your source text.

The main hurdle for students using spaced repetition is the high effort of manually creating effective flashcards. This tool solves that by allowing users to paste source text (1,000 to 10,000 characters) and instantly receive AI-generated question-answer pairs.

### Key Features:

- **AI Generation:** Transform long notes or book fragments into flashcards in seconds using OpenRouter.
- **Review System:** Accept, edit, or reject AI-generated flashcard proposals before adding them to your library.
- **Manual Management:** Full CRUD operations for custom flashcards with real-time character limits.
- **User System:** Secure authentication via Supabase (Login, Register, Password Reset, Profile Management).
- **Data Privacy:** GDPR-compliant account deletion functionality.
- **Responsive Design:** Modern, mobile-friendly UI built with Tailwind CSS and Shadcn/ui.

## Tech Stack

### Frontend

- **Astro 5:** High-performance web framework with server-side rendering (SSR) enabled.
- **React 19:** Powers interactive components like the AI review flow and flashcard management.
- **TypeScript 5:** For robust, type-safe development.
- **Tailwind CSS 4:** For modern, utility-first styling.
- **Shadcn/ui:** Accessible and customizable UI components.

### Backend & Infrastructure

- **Supabase:** PostgreSQL database, Authentication (GoTrue), and SSR-ready client integration.
- **OpenRouter.ai:** Unified API to access various LLMs for flashcard generation.
- **GitHub Actions:** Automated CI/CD pipeline for running unit tests and linting on push.
- **Husky & lint-staged:** Pre-commit hooks for code quality.

## Getting Started Locally

### Prerequisites

- **Node.js:** version `22.14.0` (refer to `.nvmrc`)
- **Supabase Account:** For database and authentication.
- **OpenRouter API Key:** To enable AI features.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/marcinkegel/10x-flashcard-builder.git
   cd 10x-flashcard-builder
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your credentials:

   ```env
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Available Scripts

| Script                    | Description                                      |
| :------------------------ | :----------------------------------------------- |
| `npm run dev`             | Starts the development server.                   |
| `npm run build`           | Builds the application for production.           |
| `npm run preview`         | Locally previews the production build.           |
| `npm run lint`            | Runs ESLint to check for code quality issues.    |
| `npm run lint:fix`        | Automatically fixes linting issues.              |
| `npm run format`          | Formats the codebase using Prettier.             |
| `npm run astro`           | Access the Astro CLI.                            |
| `npm run test`            | Runs unit tests with Vitest.                     |
| `npm run test:watch`      | Runs unit tests in watch mode.                   |
| `npm run test:ui`         | Opens Vitest UI for interactive testing.         |
| `npm run test:coverage`   | Generates test coverage report.                  |
| `npm run test:e2e`        | Runs end-to-end tests with Playwright.           |
| `npm run test:e2e:ui`     | Opens Playwright UI for interactive E2E testing. |
| `npm run test:e2e:report` | Views the Playwright test report.                |

## Testing

This project uses a comprehensive testing strategy:

- **Unit Tests:** Vitest with React Testing Library for component and service testing.
- **E2E Tests:** Playwright for browser-based end-to-end testing.
- **API Mocking:** MSW (Mock Service Worker) for realistic API testing in unit/integration tests.

For detailed testing documentation, see:

- [TESTING.md](./TESTING.md) - Comprehensive testing guide.
- [.ai/testing-quick-reference.md](./.ai/testing-quick-reference.md) - Quick reference for common patterns.
- [.ai/testing-setup-summary.md](./.ai/testing-setup-summary.md) - Setup summary.

## Project Scope

### Included in MVP:

- ✅ AI flashcard generation (1k-10k char input) via OpenRouter.
- ✅ Review system (Accept/Edit/Reject AI proposals).
- ✅ Manual flashcard creation (200 char front / 500 char back limit).
- ✅ Flashcard Library with full CRUD operations.
- ✅ User authentication (Login, Register, Password Reset).
- ✅ Profile management and account deletion.
- ✅ Automated CI/CD with GitHub Actions (Linting, Unit Tests, and E2E Tests).

### Out of Scope (Future Updates):

- Spaced repetition study sessions (in progress).
- External file imports (PDF, DOCX).
- Deck sharing between users.
- Native mobile applications.
- Integration with 3rd party platforms like Anki or Quizlet.

## Project Status

**Current Status:** `MVP Development`
The project has implemented core AI generation, flashcard management, and authentication. CI/CD is fully configured for linting, unit tests, and E2E tests. A comprehensive suite of E2E tests is operational both locally and in the automated CI pipeline. Testing coverage is being actively maintained and expanded.

## License

This project is licensed under the MIT License.
