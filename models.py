from pydantic import BaseModel, Field

class Flashcard(BaseModel):
    front: str = Field(description="The question or term on the front of the card")
    back: str = Field(description="The answer or definition on the back of the card")


class MCQ(BaseModel):
    question: str
    options: list[str] = Field(description="Exactly four answer choices")
    correct_index: int = Field(description="Index (0-3) of the correct option")
    explanation: str = Field(description="A short reason why the correct answer is right")


class Summary(BaseModel):
    overview: str = Field(description="A 2-3 sentence high-level summary of the notes")
    key_points: list[str] = Field(description="The main takeaways, one item each")