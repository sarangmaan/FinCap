# Fin Cap - AI Financial Analyst

A comprehensive AI-powered financial analysis tool that detects market bubbles, provides detailed company reports, and offers early warning risk assessments.

## 🔑 Getting Started

### 1. API Key Setup (Required)
You **must** set up your Groq API key as an environment variable. 

1.  Get a key from [Groq Cloud Console](https://console.groq.com/keys).
2.  Create a file named `.env` in the root directory.
3.  Add your API key:
    ```
    GROQ_API_KEY=gsk_your_actual_api_key_here
    ```

### 2. Running the Application
This app has two parts: a React frontend and a Node.js backend (to securely proxy API requests).

**Option A: Development Mode**
You need two terminals:

1.  **Terminal 1 (Backend):**
    ```bash
    npm install
    node server.js
    ```
    *This runs the API proxy on http://localhost:3000*

2.  **Terminal 2 (Frontend):**
    ```bash
    npm run dev
    ```
    *This runs the UI on http://localhost:5173*

**Option B: Production / Deployment**
Deploy to a host like Vercel or Render. Ensure you set the `GROQ_API_KEY` environment variable in your hosting provider's dashboard.

## 🚀 Features
*   **Market Analysis**: Deep dives into stocks, crypto, and indices.
*   **Portfolio Tracker**: Manual portfolio entry with AI risk auditing.
*   **Bubble Scope**: Dedicated mode to detect overvalued sectors and crash risks.
*   **Visual Reports**: Markdown reports, risk gauges, and interactive charts.

## 🔒 Security Note
The frontend never sees your API key. It is stored securely on the server (or serverless function) via `process.env.GROQ_API_KEY`.