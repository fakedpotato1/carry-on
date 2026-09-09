# LoadShift Prototype

LoadShift is a React and Vite prototype for planning group assignments, reviewing contribution evidence, and confirming fair workload changes through an interactive project canvas.

## Prerequisites

- Node.js 20 or newer
- npm

Check that both are available:

```powershell
node --version
npm --version
```

## Install

From the project directory, install the dependencies:

```powershell
npm install
```

## Start the website

Run the Vite development server:

```powershell
npm run dev
```

Open the local address printed by Vite, normally:

```text
http://localhost:5173/
```

Keep the terminal running while using the website. Press `Ctrl+C` in that terminal to stop the server.

## Production build

Create an optimized build in the `dist` directory:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

## Optional browser QA

The repository includes a Playwright-based verification script:

```powershell
npm run qa
```

The QA command expects Google Chrome at the standard Windows installation path and a development server running at `http://127.0.0.1:5173`.

## Main routes

- `/` - Dashboard
- `/project/new` - Create Project
- `/project/:id/canvas` - Project Canvas
- `/project/:id/evidence` - Evidence Pack
- `/project/:id/lecturer-email` - Lecturer Email Draft
- `/project/:id/rubric-evaluation` - Rubric Evaluation
