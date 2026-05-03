# Nexaris Module - Your Personal Productivity Workspace

Welcome to the Nexaris Module, a comprehensive personal productivity workspace designed to integrate your work, life, and intelligence into one unified and powerful environment. This application is built to be your all-in-one solution for managing every facet of your personal and professional life with the help of a sophisticated AI assistant.

![Nexaris Module](https://picsum.photos/seed/nexaris-module/1200/600)
<p align="center"><i>A unified dashboard for your entire life.</i></p>

## Deployment Note (Netlify)
This project is configured for Netlify deployment with Serverless Functions.
- **API Routes**: Serverless functions are enabled (static export disabled).
- **Environment Variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `MISTRAL_API_KEY` are set in your Netlify Site Settings.

## Philosophy and Design Principles

The Nexaris Module is built on a few core principles:

*   **Unified Workspace**: Instead of switching between dozens of apps for tasks, notes, finance, and projects, Nexaris provides a single, interconnected environment. Data from one "room" can inform and enhance another.
*   **AI-Enhanced Productivity**: "Alfred," your personal AI assistant, is integrated throughout the application to provide insights, automate tasks, summarize information, and help you make better decisions.
*   **Gamified Growth**: We believe in making self-improvement engaging. The Growth Hub turns your productivity into a game, rewarding you for completing tasks and achieving your goals.
*   **Privacy and Ownership**: Your data is yours. The application is designed to run in your own environment, using your own Firebase backend, giving you full control over your information.
*   **Deep Customization**: From themes and layouts to keyboard shortcuts and sidebar navigation, you can tailor almost every aspect of the Nexaris Module to fit your unique workflow.

## Core Features

The Nexaris Module is composed of several interconnected "rooms," each tailored for a specific domain of your life:

*   **Dashboard**: A high-level overview of all your modules, providing a quick snapshot of your tasks, projects, finances, and more.
*   **Alfred (AI Room)**: Your personal AI assistant, ready to answer questions, provide insights, and help you manage your digital world.
*   **Tasks Room**: A robust task management system with features for grouping, scheduling, and tracking your to-do lists.
*   **Notes**: A flexible and powerful note-taking application that serves as your personal knowledge base.
*   **File Vault**: A secure, organized space for all your important documents and files, with easy upload and preview capabilities.
*   **Project Board**: A Kanban-style board to manage your projects from start to finish, tracking their status and progress.
*   **Finance Hub**: A complete financial toolkit to monitor your net worth, track income and expenses, and manage your accounts.
*   **Clients & Business**: A CRM-like feature to manage client relationships and track business-related projects.
*   **Growth Hub**: Gamify your productivity! Complete tasks and goals to earn XP, level up, and unlock new application themes and perks.
*   **Research & News**: An AI-powered research assistant to search and summarize information from the web, complemented by a news room for your daily briefings.
*   **Health & Wellness**: Keep track of your physical training, activities, and wellness goals.
*   **Learning & Networking**: Curate learning resources and manage your professional network to foster growth.
*   **Asset Tracker**: An inventory for your physical, digital, and creative assets.
*   **Brand Room**: A central hub for managing your personal or professional brand identity, including logos, color palettes, and fonts.
*   **Workshop**: A space for your fabrication and R&D projects, integrated with your project board and asset inventory.
*   **Settings**: A comprehensive settings panel to customize every aspect of your workspace, from theme and layout to shortcuts and navigation.

## Tech Stack

This application is built with a modern, robust, and scalable technology stack:

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
*   **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
*   **State Management**: React Context & Hooks for local/in-memory state.

## Getting Started

Follow these steps to get the Nexaris Module running in your local development environment.

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn
*   A Firebase project. If you don't have one, you can create one for free at the [Firebase Console](https://console.firebase.google.com/).

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd nexaris-module
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**:
    Rename the `.env.example` file to `.env` and populate it with your Firebase project's configuration keys. You can find these in your Firebase project settings under "Your apps" > "Web app".
    ```env
    # Firebase Configuration
    # Replace with your actual Firebase project configuration
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
    NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef..."
    ```

4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    This will start the application, typically on `http://localhost:9002`.

5.  **Access the Application**:
    Open your browser and navigate to the local URL. The initial setup process will guide you through creating your user profile.

## Application Structure

The project is organized to be scalable and maintainable, with a clear separation of concerns.

*   `src/app/(main)`: Contains all the main application pages (rooms). Each room has its own `page.tsx`.
*   `src/app/(compact)`: Contains layout-minimal pages like the login screen.
*   `src/components`: Contains all shared React components, organized by feature (e.g., `components/dashboard`, `components/tasks`).
*   `src/components/ui`: Houses the core ShadCN UI components (Button, Card, etc.). These are generally not modified directly.
*   `src/lib`: Contains utility functions (`utils.ts`), type definitions (`types.ts`), and static data like navigation items (`nav-items.ts`).
*   `src/hooks`: Custom React hooks used throughout the application (e.g., `use-debounce.ts`).
*   `src/firebase`: Contains all Firebase configuration (`config.ts`), providers, and custom hooks (`useUser`, `useCollection`, etc.).
*   `docs/backend.json`: A schema defining the data structures and Firestore collections for the application. This serves as a blueprint for the database.
*   `firestore.rules`: Security rules for the Firestore database, ensuring user data privacy and security.

## Firebase Integration

The application relies on Firebase for its backend services:

*   **Firebase Authentication**: Manages user sign-up, login, and sessions.
*   **Firestore**: A NoSQL database used to store all user-generated data, from tasks and notes to financial transactions. The database structure is designed with a user-centric approach, where all of a user's data is stored in subcollections under their unique user ID (`/users/{userId}/...`).
*   **Security Rules**: The `firestore.rules` file enforces a strict security model: **users can only read and write their own data**. This is critical for privacy and data integrity.

## State Management

The application uses a combination of React Context and custom hooks for state management, avoiding the need for a heavy external library like Redux.

*   **`src/components/layout/app-provider.tsx`**: This is the heart of the state management. It creates an `AppContext` that provides all the core data (tasks, notes, projects, etc.) and their respective `setState` functions to the entire application.
*   **`useApp()` Hook**: This custom hook provides an easy way for any component to access the global state and actions.
*   **`useSafeLocalStorage` Hook**: All data is persisted to the browser's Local Storage. This hook ensures that your data is saved as you work and is reloaded when you open the app again.

## Styling and Theming

*   **Tailwind CSS**: Used for all styling, providing a utility-first approach for rapid UI development.
*   **ShadCN/UI**: The component library is built on top of Radix UI and Tailwind CSS, offering a set of beautiful, accessible, and customizable components.
*   **CSS Variables**: The theme system is built on CSS variables defined in `src/app/globals.css`. This allows for easy and dynamic theme switching. You can unlock new themes by leveling up in the **Growth Hub**.

---

This project was bootstrapped with Firebase Studio.
