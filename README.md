# 10x Flashcard Builder

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
An AI-powered web application designed to aid the way you study. 10x Flashcard Builder reduces the time and cognitive effort required to create high-quality study materials by leveraging Large Language Models (LLMs) to automatically generate flashcards from your source text.
The main hurdle for students using spaced repetition is the high effort of manually creating effective flashcards. This tool solves that by allowing users to paste source text (1,000 to 10,000 characters) and instantly receive AI-generated question-answer pairs. 

### Key Features:
- **AI Generation:** Transform long notes or book fragments into flashcards in seconds.
- **Spaced Repetition:** Integrated study sessions based on proven learning algorithms.
- **Manual Management:** Full CRUD operations for custom flashcards with real-time character limits.
- **Analytics:** Tracks progress and see what precentage of the flashcards are made by AI and what percentage of the AI made flashcards are accepted.
- **User System:** Secure authentication and data privacy (GDPR-compliant account deletion).

## Tech Stack

### Frontend
- **Astro 5:** For high-performance static site generation and modern routing.
- **React 19:** Powers interactive components like the study session and AI review flow.
- **TypeScript 5:** For robust, type-safe development.
- **Tailwind CSS 4 & Shadcn/ui:** For a modern, responsive, and accessible user interface.

### Backend & Infrastructure
- **Supabase:** Provides PostgreSQL database, Authentication, and real-time capabilities.
- **OpenRouter.ai:** Unified API to access various LLMs (OpenAI, Anthropic, Google) for flashcard generation.
- **Docker:** For consistent environments and easy deployment.
- **GitHub Actions:** Automated CI/CD pipelines.
- **DigitalOcean:** Cloud hosting for the production application.

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

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with hot-module replacement. |
| `npm run build` | Builds the application for production. |
| `npm run preview` | Locally previews the production build. |
| `npm run lint` | Runs ESLint to check for code quality issues. |
| `npm run format` | Formats the codebase using Prettier. |
| `npm run astro` | Access the Astro CLI for advanced configurations. |
| `npm run test` | Runs unit tests with Vitest. |
| `npm run test:watch` | Runs unit tests in watch mode. |
| `npm run test:ui` | Opens Vitest UI for interactive testing. |
| `npm run test:coverage` | Generates test coverage report. |
| `npm run test:e2e` | Runs end-to-end tests with Playwright. |
| `npm run test:e2e:ui` | Opens Playwright UI for interactive E2E testing. |
| `npm run test:e2e:report` | Views the Playwright test report. |

## Testing

This project uses a comprehensive testing strategy:

- **Unit Tests:** Vitest with React Testing Library for component and function testing
- **E2E Tests:** Playwright for browser-based end-to-end testing
- **API Mocking:** MSW (Mock Service Worker) for realistic API testing

For detailed testing documentation, see:
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [.ai/testing-quick-reference.md](./.ai/testing-quick-reference.md) - Quick reference for common patterns
- [.ai/testing-setup-summary.md](./.ai/testing-setup-summary.md) - Setup summary

## Project Scope

### Included in MVP:
- AI flashcard generation (1k-10k char input).
- Review system (Accept/Edit/Reject AI proposals).
- Manual flashcard creation (200 char front / 500 char back limit).
- Study session based on spaced repetition.
- User registration and login.
- Basic statistics (AI adoption and acceptance rates).

### Out of Scope (Future Updates):
- External file imports (PDF, DOCX).
- Deck sharing between users.
- Native mobile applications.
- Integration with 3rd party platforms like Anki or Quizlet.
- Push notifications for study reminders.

## Project Status

**Current Status:** `MVP Development`  
The project is currently in its Initial MVP phase, focusing on core AI generation and study session functionality.

## License

This project is licensed under the MIT License.