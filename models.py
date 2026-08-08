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


class MindMapNode(BaseModel):
    id: str = Field(description="A unique short identifier for the node (e.g. 'root', 'node-1', etc.)")
    label: str = Field(description="A brief label (1-4 words) describing the concept")
    children: list['MindMapNode'] = Field(default=[], description="Sub-concepts or details branches under this concept")


# Resolve forward references for recursive definition in Pydantic v2
MindMapNode.model_rebuild()


class MindMap(BaseModel):
    topic: str = Field(description="The central main subject of the study material")
    root: MindMapNode = Field(description="The root node of the hierarchical mind map tree")