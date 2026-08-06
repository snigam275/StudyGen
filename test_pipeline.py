import os

from dotenv import load_dotenv
from google import genai

from models import MCQ

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# gemini-2.5-flash is a safe, free-tier default. If you want the newest model,
# open Google AI Studio, copy the current Flash model id, and paste it here.
MODEL = "gemini-2.5-flash"

sample_text = """
Photosynthesis is the process by which green plants convert sunlight,
water, and carbon dioxide into glucose and oxygen. It happens in the
chloroplasts using the green pigment chlorophyll. The process has two
main stages: the light-dependent reactions and the Calvin cycle.
"""

response = client.models.generate_content(
    model=MODEL,
    contents=f"Create 3 multiple-choice questions based on this text:\n\n{sample_text}",
    config={
        "response_mime_type": "application/json",
        "response_schema": list[MCQ],
    },
)

questions: list[MCQ] = response.parsed

print(f"OK - got {len(questions)} question(s) back\n")
for i, q in enumerate(questions, 1):
    print(f"Q{i}: {q.question}")
    for j, option in enumerate(q.options):
        marker = "*" if j == q.correct_index else " "
        print(f"   [{marker}] {option}")
    print(f"   -> {q.explanation}\n")