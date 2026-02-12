from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import google.generativeai as genai

# Import local modules
from database import SessionLocal, engine, Base
from models import Book
from services.pdf import extract_text_from_pdf

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CORS Setup
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        return {"error": "File must be a PDF"}
    
    try:
        contents = await file.read()
        text = extract_text_from_pdf(contents)
        
        if not text:
            return {"error": "Could not extract text from PDF"}

        # Save to DB
        new_book = Book(filename=file.filename, content=text)
        db.add(new_book)
        db.commit()
        db.refresh(new_book)
        
        return {"id": new_book.id, "filename": new_book.filename, "status": "processed"}
    except Exception as e:
        print(f"Upload error: {e}")
        return {"error": str(e)}

@app.post("/api/chat")
async def chat_with_book(
    message: str = Body(...),
    book_id: int = Body(...),
    db: Session = Depends(get_db)
):
    # 1. Get Book Content
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # 2. Configure Gemini
    key_to_use = os.getenv("GEMINI_API_KEY")
    
    if not key_to_use:
        return {"error": "Server API Key not configured."}
    
    try:
        genai.configure(api_key=key_to_use)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # 3. Construct Prompt (Simple Context Stuffing for now)
        # For very large books, RAG would be better, but context window is large enough for many.
        # We'll truncate if absolutely necessary, but Flash has 1M token context.
        prompt = f"""
You are a helpful study assistant. Answer the user's question based ONLY on the following book content.
If the answer is not in the text, say you don't know.

Book Content:
{book.content[:100000]}... (truncated if too long)

User Question: {message}
"""
        response = model.generate_content(prompt)
        return {"response": response.text}
        
    except Exception as e:
        print(f"Chat error: {e}")
        return {"error": f"AI Error: {str(e)}"}


# --- Static Files & SPA Fallback ---

# Check if static directory exists (it will be created by build script)
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    
    # Catch-all route for SPA
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Allow API routes to pass through if they weren't caught above
        if full_path.startswith("api/"):
            return {"error": "API route not found"}
        
        # Serve index.html for everything else (client-side routing)
        if os.path.exists("static/index.html"):
             return FileResponse("static/index.html")
        return {"error": "Frontend not built"}

# Run with: uvicorn main:app --reload
