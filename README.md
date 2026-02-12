# Book Study Assistant

Bot that helps you study the content of a book. It can answer your questions, provide summaries, and help you learn faster!

## 🚀 Features
- **PDF Upload**: Upload any PDF book (up to 50MB).
- **Smart Extraction**: Automatically extracts text and metadata (page count, title).
- **AI Chat**: Chat with your book using Google Gemini AI.
- **Local & Cloud**: Runs entirely locally or deploys easily to the cloud.

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite.
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite (Local) / PostgreSQL (Prod).
- **AI**: Google Gemini Flash 1.5.

## 💻 Local Setup

Follow these steps to run the app on your own machine.

### 1. Prerequisites
- Python 3.9+
- Node.js & npm
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 2. Backend Setup
```bash
cd server
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Secrets
# Create a .env file and add: GEMINI_API_KEY=your_key_here
```

### 3. Frontend Setup
```bash
cd client
npm install
```

### 4. Run the App
You need two terminals:

**Terminal 1 (Backend):**
```bash
cd server
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to start studying!

## ☁️ Deployment (Render)

This project is configured for free deployment on [Render](https://render.com).

1.  Push code to GitHub.
2.  Create a **New Web Service** on Render connected to your repo.
3.  **Build Command**: `./build.sh`
4.  **Start Command**: `cd server && uvicorn main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables**:
    - `PYTHON_VERSION`: `3.11.0`
    - `GEMINI_API_KEY`: Your API Key.

See [deployment.md](deployment.md) for a detailed guide.

## 🔄 How to Update

When you make changes to the code, push them to GitHub to update your live site:

```bash
git add .
git commit -m "Describe your changes"
git push
```
Render will automatically redeploy the new version.
