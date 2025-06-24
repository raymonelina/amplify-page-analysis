Amplify Vite React Template
This repository is a minimal example for building a React application with Vite and AWS Amplify (Gen 2). It provides an Amplify backend configured for authentication and a simple Todo API, along with a TypeScript/React frontend.

Project Structure
amplify-page-analysis/
├── amplify/                 # Amplify backend definitions
│   ├── backend.ts           # Registers auth and data resources
│   ├── auth/resource.ts     # Email-based Cognito auth
│   └── data/resource.ts     # Todo model and API
├── public/                  # Static assets (e.g., vite.svg)
├── src/                     # React application source
│   ├── App.tsx              # Todo list example
│   ├── main.tsx             # Amplify/Authenticator setup
│   └── ...                  # Styles and assets
├── index.html               # Entry HTML
├── package.json             # NPM scripts and dependencies
├── vite.config.ts           # Vite configuration
└── amplify.yml              # CI/CD pipeline definition
Amplify Backend
The backend is defined in amplify/backend.ts and registers two resources: auth and data

Authentication (amplify/auth/resource.ts): configures sign-in with email using defineAuth

Data (amplify/data/resource.ts): defines a Todo model with a single content field and owner-based authorization rules. The resource uses a user pool by default and allows API key access for public rules

React Frontend
The entry point (src/main.tsx) loads Amplify configuration, wraps the application with Authenticator, and mounts the React app

App.tsx demonstrates CRUD operations on the Todo model using the generated Amplify Data client

The application’s HTML skeleton resides in index.html

Scripts
Relevant NPM scripts (defined in package.json) include:

npm run dev – start a local development server

npm run build – compile TypeScript and bundle via Vite

npm run lint – run ESLint on the project

npm run preview – serve a production build locally


CI/CD
amplify.yml describes build and deployment steps for the Amplify Console. It installs dependencies, runs an Amplify pipeline deploy, and then builds the frontend into the dist directory

Getting Started
Install dependencies

npm install
Configure Amplify

Initialize and deploy the backend using the Amplify CLI (Gen 2). After deployment, an amplify_outputs.json file is generated (ignored by Git) and consumed by src/main.tsx.

Run locally

npm run dev
Visit http://localhost:5173 (default Vite port). The app prompts for sign‑in and then shows a list of Todos.

Build

npm run build
The production build is output to the dist folder.

Deploy

The project is set up for Amplify Console deployments via amplify.yml. Push to your Amplify-connected repository or run an Amplify pipeline deploy.

Contributing
See CONTRIBUTING.md and CODE_OF_CONDUCT.md for guidelines.

License
Distributed under the MIT No Attribution license. See LICENSE for details.
