from io import BytesIO
from typing import Optional
import json
import os
import hashlib

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pypdf import PdfReader

from models import Summary, Flashcard, MCQ, MindMap
from llm import make_summary, make_flashcards, make_quiz, make_chat_response, make_mindmap
from database import init_db, get_cached_item, set_cached_item

app = FastAPI(title="StudyGen API")

# Let the React frontend (which runs on a different port) talk to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

def read_pdf(data: bytes) -> str:
    """Turn an uploaded PDF's bytes into plain text."""
    reader = PdfReader(BytesIO(data))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


# Resolve frontend static directory relative to this file
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
assets_dir = os.path.join(frontend_dist, "assets")

# Mount React static compiled CSS/JS assets
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
async def root():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "StudyGen API is running. Build the frontend first (npm run build) to serve the UI."}


@app.post("/summary")
async def summary_endpoint(file: UploadFile = File(...)) -> Summary:
    try:
        file_bytes = await file.read()
        pdf_hash = hashlib.sha256(file_bytes).hexdigest()
        
        # Check cache
        cached = get_cached_item(pdf_hash, "summary")
        if cached:
            return Summary(**cached)
            
        text = read_pdf(file_bytes)
        result = make_summary(text)
        
        # Save cache
        set_cached_item(pdf_hash, file.filename, "summary", result.model_dump())
        return result
    except Exception as e:
        err_msg = str(e)
        if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded (Free Tier limit: 20 requests/day). Please wait a moment or check your billing plan.")
        raise HTTPException(status_code=500, detail=f"LLM Error: {err_msg}")


@app.post("/flashcards")
async def flashcards_endpoint(file: UploadFile = File(...), num_cards: int = 10) -> list[Flashcard]:
    try:
        file_bytes = await file.read()
        pdf_hash = hashlib.sha256(file_bytes).hexdigest()
        
        # Check cache
        cached = get_cached_item(pdf_hash, "flashcards")
        if cached:
            return [Flashcard(**fc) for fc in cached]
            
        text = read_pdf(file_bytes)
        result = make_flashcards(text, num_cards=num_cards)
        
        # Save cache
        set_cached_item(pdf_hash, file.filename, "flashcards", [fc.model_dump() for fc in result])
        return result
    except Exception as e:
        err_msg = str(e)
        if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded (Free Tier limit: 20 requests/day). Please wait a moment or check your billing plan.")
        raise HTTPException(status_code=500, detail=f"LLM Error: {err_msg}")


@app.post("/quiz")
async def quiz_endpoint(
    file: UploadFile = File(...), 
    num_questions: int = 5, 
    difficulty: str = "medium",
    exclude_questions: Optional[str] = Form(None)
) -> list[MCQ]:
    try:
        file_bytes = await file.read()
        pdf_hash = hashlib.sha256(file_bytes).hexdigest()
        
        # Check cache
        cached = get_cached_item(pdf_hash, "quiz")
        if cached:
            return [MCQ(**q) for q in cached]
            
        text = read_pdf(file_bytes)
        exclude_list = []
        if exclude_questions:
            try:
                exclude_list = json.loads(exclude_questions)
            except Exception:
                exclude_list = [q.strip() for q in exclude_questions.split(",") if q.strip()]
        result = make_quiz(text, num_questions=num_questions, difficulty=difficulty, exclude_questions=exclude_list)
        
        # Save cache
        set_cached_item(pdf_hash, file.filename, "quiz", [q.model_dump() for q in result])
        return result
    except Exception as e:
        err_msg = str(e)
        if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded (Free Tier limit: 20 requests/day). Please wait a moment or check your billing plan.")
        raise HTTPException(status_code=500, detail=f"LLM Error: {err_msg}")


@app.post("/mindmap")
async def mindmap_endpoint(file: UploadFile = File(...)) -> MindMap:
    try:
        file_bytes = await file.read()
        pdf_hash = hashlib.sha256(file_bytes).hexdigest()
        
        # Check cache
        cached = get_cached_item(pdf_hash, "mindmap")
        if cached:
            return MindMap(**cached)
            
        text = read_pdf(file_bytes)
        result = make_mindmap(text)
        
        # Save cache
        set_cached_item(pdf_hash, file.filename, "mindmap", result.model_dump())
        return result
    except Exception as e:
        err_msg = str(e)
        if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded (Free Tier limit: 20 requests/day). Please wait a moment or check your billing plan.")
        raise HTTPException(status_code=500, detail=f"LLM Error: {err_msg}")


@app.post("/chat")
async def chat_endpoint(question: str, file: UploadFile = File(...)):
    try:
        text = read_pdf(await file.read())
        answer = make_chat_response(text, question)
        return {"answer": answer}
    except Exception as e:
        err_msg = str(e)
        if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded (Free Tier limit: 20 requests/day). Please wait a moment or check your billing plan.")
        raise HTTPException(status_code=500, detail=f"LLM Error: {err_msg}")


@app.get("/favicon.svg")
async def favicon():
    fav_path = os.path.join(frontend_dist, "favicon.svg")
    if os.path.exists(fav_path):
        return FileResponse(fav_path)
    return {"error": "favicon not found"}


@app.get("/icons.svg")
async def icons():
    icons_path = os.path.join(frontend_dist, "icons.svg")
    if os.path.exists(icons_path):
        return FileResponse(icons_path)
    return {"error": "icons not found"}


@app.get("/{catchall:path}")
async def serve_frontend(catchall: str):
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "StudyGen API is running. Build the frontend first (npm run build) to serve the UI."}