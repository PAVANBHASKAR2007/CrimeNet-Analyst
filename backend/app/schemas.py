from pydantic import BaseModel
from typing import List, Optional
import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class CaseCreate(BaseModel):
    case_number: str
    title: str
    description: Optional[str] = ""


class CaseOut(BaseModel):
    id: int
    case_number: str
    title: str
    description: str
    status: str
    created_at: datetime.datetime
    report_count: int = 0
    entity_count: int = 0
    uploaded_by: str = ""

    class Config:
        from_attributes = True


class ReportOut(BaseModel):
    id: int
    case_id: int
    filename: str
    uploaded_at: datetime.datetime
    entity_count: int = 0

    class Config:
        from_attributes = True


class EntityOut(BaseModel):
    id: int
    name: str
    entity_type: str
    mention_count: int

    class Config:
        from_attributes = True


class GraphNode(BaseModel):
    id: int
    label: str
    type: str
    mention_count: int


class GraphEdge(BaseModel):
    source: int
    target: int
    strength: int
    case_ids: List[int]


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class InsightOut(BaseModel):
    id: int
    type: str
    description: str
    related_entity_ids: List[int]
    related_case_ids: List[int]
    severity: str
    reviewed: bool

    class Config:
        from_attributes = True
