from pydantic import BaseModel, Field
from typing import Optional

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


class MindMapNodeFlat(BaseModel):
    id: str = Field(description="A unique short identifier for the node (e.g. 'root', 'branch-1', 'leaf-1-1')")
    label: str = Field(description="A brief label (1-4 words) describing the concept")
    parent_id: Optional[str] = Field(None, description="The ID of the parent node, or null/None if it is the root node")


class MindMap(BaseModel):
    topic: str = Field(description="The central main subject of the study material")
    nodes: list[MindMapNodeFlat] = Field(description="A flat list of all concept nodes in the mind map, linked by parent_id")