from io import BytesIO
from typing import Optional
import json
import os

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pypdf import PdfReader

from models import Summary, Flashcard, MCQ
from llm import make_summary, make_flashcards, make_quiz, make_chat_response

app = FastAPI(title="StudyGen API")

# Let the React frontend (which runs on a different port) talk to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        text = read_pdf(await file.read())
        return make_summary(text)
    except Exception as e:
        err_msg = str(e)
        if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded (Free Tier limit: 20 requests/day). Please wait a moment or check your billing plan.")
        raise HTTPException(status_code=500, detail=f"LLM Error: {err_msg}")


@app.post("/flashcards")
async def flashcards_endpoint(file: UploadFile = File(...), num_cards: int = 10) -> list[Flashcard]:
    try:
        text = read_pdf(await file.read())
        return make_flashcards(text, num_cards=num_cards)
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
        text = read_pdf(await file.read())
        exclude_list = []
        if exclude_questions:
            try:
                exclude_list = json.loads(exclude_questions)
            except Exception:
                exclude_list = [q.strip() for q in exclude_questions.split(",") if q.strip()]
        return make_quiz(text, num_questions=num_questions, difficulty=difficulty, exclude_questions=exclude_list)
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