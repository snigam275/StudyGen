# StudyGen 🧠🌊

StudyGen is a premium, AI-powered study suite designed to transform your study materials into structured learning aids. Built with a stunning bioluminescent deep-sea dark theme, it integrates document summarization, dynamic flashcards, multiple-choice quizzes, concept mind maps, and a context-aware study chatbot in a single high-performance workspace.

---

## ✨ Key Features

*   **PDF Summarizer**: Generate concise summaries of key learning points immediately.
*   **Smart Flashcards**: Auto-generate smart flashcards with front (term/question) and back (explanation/definition) states. Supports both card deck grids and visual tree structures.
*   **Active Document Bookmarking**: Star or bookmark documents directly from active workspaces to access them instantly.
*   **Deduplicated AI Quizzes**: Test your knowledge with dynamically generated quizzes. Advanced deduplication tracks previous questions to ensure unique MCQs on consecutive runs.
*   **Context-Aware Study Chat**: A floating AI chat assistant positioned side-by-side with your study materials. It supports a physical window-style stretcher handle on the boundary line for full visibility control.
*   **Theme-Cohesive Logo Blocks**: Custom cards highlighted in oceanic colors (dark mode) or warm clay-brown colors (light mode) for a clean dashboard presentation.
*   **Bioluminescent Visuals**: Relaxing 3D floating WebGL ambient orbs and rising sea bubbles drifting behind workspace panels.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Framer Motion (for smooth layouts and animations), Lucide React (for premium iconography), and OGL (for high-performance WebGL backgrounds).
*   **Styling**: Customized Vanilla CSS variables with deep oceanic navy `#030811`, glowing cyan `#00a4e4`, and neon seafoam `#33ffd0`.
*   **Backend**: FastAPI, PyPDF (for processing uploaded documents), and Pydantic (for structured LLM response validation).
*   **AI Engine**: Gemini 2.5 Flash (Google GenAI SDK) with an automated failover system to Groq API (Llama 3.3 70B) for reliable free-tier operation.

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Gemini API Key (set in backend environment)

### 1. Backend Setup
1.  Navigate to the root directory:
    ```bash
    cd StudyGen
    ```
2.  Set up a virtual environment:
    ```bash
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # macOS/Linux
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install fastapi uvicorn google-genai python-dotenv pypdf requests pydantic
    ```
4.  Configure environment variables by creating a `.env` file in the root:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    GROQ_API_KEY=your_groq_api_key_here  # (Optional fallback)
    ```
5.  Start the FastAPI backend server:
    ```bash
    uvicorn main:app --reload
    ```

### 2. Frontend Setup
1.  Navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite local development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:5173`.

---

## 🌐 Live Unified Deployment (Render / Railway)

You can host the **entire project** (both frontend and backend) on a **single web service** (e.g., Render or Railway) with a single click. In this configuration, the FastAPI backend compiles the React app and serves the static files natively.

### Deployment Steps on Render (Free Plan):
1.  Go to [Render](https://render.com/) and click **New +** ➔ **Web Service**.
2.  Import your `StudyGen` GitHub repository.
3.  Set the following settings:
    *   **Build Command**: `npm run build --prefix frontend && pip install -r requirements.txt`
    *   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4.  Under **Environment Variables**, add:
    *   `GEMINI_API_KEY`: `your_gemini_api_key_here`
5.  Click **Create Web Service**. 

Once deployed, your live site URL will serve the compiled React app directly and route all API calls natively, requiring **zero cross-origin configuration**!

---

## 🔒 Security & Local Persistence
*   **Local Storage**: All document metrics, bookmarks, and quiz scores are stored in your browser's local storage so that your notes remain completely private and persist across reloads.
*   **Security Safety**: A root `.gitignore` blocks sensitive variables (`.env`) and local environments (`.venv/`) from accidental commits.
