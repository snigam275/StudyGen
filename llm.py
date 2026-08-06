import json
import os
import sys

from dotenv import load_dotenv
from google import genai
import requests

from models import Summary, Flashcard, MCQ
from pdf_utils import extract_text

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Same model you already tested with. Swap for the current Flash id from
# AI Studio if you ever want the newest one.
MODEL = "gemini-2.5-flash"


def _generate_groq(prompt: str, schema):
    """Fallback helper to generate structured outputs using Groq's API."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in .env")
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Convert Pydantic class schemas to standard JSON Schema to guide the LLM output structure
    if isinstance(schema, list) or (hasattr(schema, "__origin__") and schema.__origin__ is list):
        item_class = schema.__args__[0]
        schema_desc = {
            "type": "array",
            "items": item_class.model_json_schema() if hasattr(item_class, "model_json_schema") else {}
        }
    else:
        schema_desc = schema.model_json_schema() if hasattr(schema, "model_json_schema") else str(schema)
    full_prompt = (
        f"{prompt}\n\n"
        f"IMPORTANT: You MUST respond with a JSON object that adheres strictly to this JSON Schema:\n"
        f"{json.dumps(schema_desc)}\n"
    )
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "user", "content": full_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        raise RuntimeError(f"Groq API error (status {response.status_code}): {response.text}")
        
    res_data = response.json()
    content_str = res_data["choices"][0]["message"]["content"]
    content_json = json.loads(content_str)
    
    # Handle list schemas (e.g. list[Flashcard], list[MCQ])
    if isinstance(schema, list) or (hasattr(schema, "__origin__") and schema.__origin__ is list):
        item_class = schema.__args__[0]
        validated_list = []
        items = content_json
        if isinstance(content_json, dict):
            # If the LLM wrapped the array inside a dictionary field
            for key, val in content_json.items():
                if isinstance(val, list):
                    items = val
                    break
        for item in items:
            try:
                validated_list.append(item_class.model_validate(item))
            except AttributeError:
                validated_list.append(item_class(**item))
        return validated_list
    else:
        try:
            return schema.model_validate(content_json)
        except AttributeError:
            return schema(**content_json)


def _generate(prompt: str, schema):
    """Tries Gemini first, falls back to Groq if rate limited or API fails."""
    errors = []
    
    # Try Gemini
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": schema,
            },
        )
        if response.parsed:
            return response.parsed
    except Exception as e:
        errors.append(f"Gemini failed: {e}")
        print(f"Gemini API quota exceeded or error. Attempting failover to Groq... (Error: {e})")
        
        # Try Groq
        try:
            return _generate_groq(prompt, schema)
        except Exception as groq_e:
            errors.append(f"Groq failed: {groq_e}")
            print(f"Groq fallback failed too. (Error: {groq_e})")
            
    raise RuntimeError(f"Both Gemini and Groq APIs failed. Details: {'; '.join(errors)}")


def make_summary(text: str) -> Summary:
    prompt = (
        "Summarise the following study notes for a student. "
        "Give a clear overview and the main key points worth remembering.\n\n"
        + text
    )
    return _generate(prompt, Summary)


def make_flashcards(text: str, num_cards: int = 10) -> list[Flashcard]:
    prompt = (
        f"Create flashcards from the following study notes. Each card has a "
        f"question or term on the front and a clear, concise answer on the back. "
        f"Make exactly {num_cards} cards.\n\n"
        + text
    )
    return _generate(prompt, list[Flashcard])


def make_quiz(text: str, num_questions: int = 5, difficulty: str = "medium", exclude_questions: list[str] = None) -> list[MCQ]:
    exclude_clause = ""
    if exclude_questions and len(exclude_questions) > 0:
        exclude_clause = (
            "\nIMPORTANT: Do NOT repeat or include any of the following questions in the quiz. "
            "Create entirely new, different questions based on other parts of the text:\n"
            + "\n".join(f"- {q}" for q in exclude_questions[:30])
        )
    
    prompt = (
        f"Create a multiple-choice quiz from the following study notes. Make exactly "
        f"{num_questions} questions with difficulty level '{difficulty}'. Each question has 4 options, the index (0-3) of the correct "
        f"option, and a short explanation of why it is correct.{exclude_clause}\n\n"
        + text
    )
    return _generate(prompt, list[MCQ])


def _make_chat_response_groq(text: str, question: str) -> str:
    """Fallback helper to run chat Q&A using Groq's API."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in .env")
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    prompt = (
        f"You are a helpful study assistant. Answer the following question based on the provided study notes.\n\n"
        f"Question: {question}\n\n"
        f"Study Notes:\n{text}\n\n"
        f"Provide a clear, accurate, and concise answer to the student's question. If the answer cannot be found in the notes, use your general knowledge but mention it is not explicitly in the notes."
    )
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3
    }
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        raise RuntimeError(f"Groq API chat error (status {response.status_code}): {response.text}")
        
    res_data = response.json()
    return res_data["choices"][0]["message"]["content"]


def make_chat_response(text: str, question: str) -> str:
    """Tries Gemini chat first, falls back to Groq chat if rate limited."""
    errors = []
    
    # Try Gemini
    try:
        prompt = (
            f"You are a helpful study assistant. Answer the following question based on the provided study notes.\n\n"
            f"Question: {question}\n\n"
            f"Study Notes:\n{text}\n\n"
            f"Provide a clear, accurate, and concise answer to the student's question. If the answer cannot be found in the notes, use your general knowledge but mention it is not explicitly in the notes."
        )
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
        )
        return response.text
    except Exception as e:
        errors.append(f"Gemini chat failed: {e}")
        print(f"Gemini chat failed. Attempting failover to Groq... (Error: {e})")
        
        # Try Groq
        try:
            return _make_chat_response_groq(text, question)
        except Exception as groq_e:
            errors.append(f"Groq chat failed: {groq_e}")
            print(f"Groq chat fallback failed too. (Error: {groq_e})")
            
    raise RuntimeError(f"Both Gemini and Groq APIs failed to respond. Details: {'; '.join(errors)}")


# Quick test - run:  python llm.py "All about LLM.pdf"
if __name__ == "__main__":
    path = sys.argv[1]
    notes = extract_text(path)

    print("=== SUMMARY ===")
    summary = make_summary(notes)
    print(summary.overview, "\n")
    for point in summary.key_points:
        print(" -", point)

    print("\n=== FLASHCARDS ===")
    for card in make_flashcards(notes):
        print(f"Q: {card.front}")
        print(f"A: {card.back}\n")

    print("=== QUIZ ===")
    for i, q in enumerate(make_quiz(notes), 1):
        print(f"Q{i}: {q.question}")
        for j, option in enumerate(q.options):
            marker = "*" if j == q.correct_index else " "
            print(f"   [{marker}] {option}")
        print(f"   -> {q.explanation}\n")