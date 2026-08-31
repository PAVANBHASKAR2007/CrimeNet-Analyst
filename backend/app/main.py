from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import os

from app.database import init_db, get_db, User, Case, Report, Entity, EntityMention, Relationship, Insight
from app import schemas, auth
from app.nlp.extractor import extract_entities, normalize, resolve_duplicate
from app.nlp.analyzer import rebuild_relationships_for_report, generate_insights
from app.nlp.file_parser import parse_file

ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".txt", ".csv"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB

app = FastAPI(title="SIH26189 - AI-Powered Criminal Network Analysis System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    db = next(get_db())
    if not db.query(User).filter(User.username == "investigator").first():
        db.add(User(
            username="investigator",
            password_hash=auth.hash_password("sih2026"),
            full_name="Demo Investigator",
            role="investigator",
        ))
        db.commit()


# ---------- AUTH ----------
@app.post("/api/auth/login")
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not auth.verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = auth.create_token(user.username)
    return {"token": token, "username": user.username, "full_name": user.full_name}


# ---------- CASES ----------
def _case_with_counts(db: Session, case: Case) -> dict:
    """Attach report_count and entity_count (distinct entities mentioned in
    this case) to a Case row without altering the Case model itself."""
    report_count = db.query(Report).filter(Report.case_id == case.id).count()
    entity_count = (
        db.query(EntityMention.entity_id)
        .filter(EntityMention.case_id == case.id)
        .distinct()
        .count()
    )
    return {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "created_at": case.created_at,
        "report_count": report_count,
        "entity_count": entity_count,
        "uploaded_by": case.uploaded_by or "",
    }


@app.get("/api/cases", response_model=List[schemas.CaseOut])
def list_cases(db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    return [_case_with_counts(db, c) for c in cases]


@app.post("/api/cases", response_model=schemas.CaseOut)
def create_case(payload: schemas.CaseCreate, db: Session = Depends(get_db), user: str = Depends(auth.verify_token)):
    if db.query(Case).filter(Case.case_number == payload.case_number).first():
        raise HTTPException(status_code=400, detail="Case number already exists")
    case = Case(case_number=payload.case_number, title=payload.title,
                description=payload.description, uploaded_by=user)
    db.add(case)
    db.commit()
    db.refresh(case)
    return _case_with_counts(db, case)


@app.get("/api/cases/{case_id}", response_model=schemas.CaseOut)
def get_case(case_id: int, db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    case = db.query(Case).get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return _case_with_counts(db, case)


@app.get("/api/cases/{case_id}/reports", response_model=List[schemas.ReportOut])
def case_reports(case_id: int, db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    reports = db.query(Report).filter(Report.case_id == case_id).all()
    result = []
    for r in reports:
        entity_count = (
            db.query(EntityMention.entity_id)
            .filter(EntityMention.report_id == r.id)
            .distinct()
            .count()
        )
        result.append({
            "id": r.id, "case_id": r.case_id, "filename": r.filename,
            "uploaded_at": r.uploaded_at, "entity_count": entity_count,
        })
    return result


# ---------- REPORT UPLOAD + NLP PIPELINE ----------
@app.post("/api/cases/{case_id}/upload")
async def upload_report(case_id: int, file: UploadFile = File(...),
                         db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    case = db.query(Case).get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext or 'unknown'}'. Only .pdf, .txt, and .csv files are supported.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File is too large. Maximum size is 10MB.")

    try:
        text = parse_file(file.filename, content)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="This file could not be read. If it's a scanned/image-only PDF, text extraction isn't "
                   "supported in this prototype — try a text-based PDF, .txt, or .csv file instead.",
        )

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from this file.")

    report = Report(case_id=case_id, filename=file.filename, raw_text=text)
    db.add(report)
    db.commit()
    db.refresh(report)

    # Run NLP extraction
    extracted = extract_entities(text)

    # Preload existing entities for fuzzy dedup
    existing = [
        {"id": e.id, "name": e.name, "normalized_name": e.normalized_name, "entity_type": e.entity_type}
        for e in db.query(Entity).all()
    ]

    created_entities = []
    for item in extracted:
        match = resolve_duplicate(item["name"], item["entity_type"], existing)
        if match:
            entity = db.query(Entity).get(match["id"])
            entity.mention_count += 1
        else:
            entity = Entity(
                name=item["name"],
                normalized_name=normalize(item["name"]),
                entity_type=item["entity_type"],
                mention_count=1,
            )
            db.add(entity)
            db.flush()
            existing.append({"id": entity.id, "name": entity.name,
                              "normalized_name": entity.normalized_name, "entity_type": entity.entity_type})

        db.add(EntityMention(
            entity_id=entity.id, report_id=report.id, case_id=case_id,
            context_snippet=item["context"],
        ))
        created_entities.append({"id": entity.id, "name": entity.name, "type": entity.entity_type})

    db.commit()

    rebuild_relationships_for_report(db, report.id, case_id)
    generate_insights(db)

    by_type = {}
    for e in created_entities:
        by_type.setdefault(e["type"], []).append(e["name"])

    return {
        "report_id": report.id,
        "filename": report.filename,
        "entities_found": len(created_entities),
        "entities": created_entities,
        "by_type": by_type,
    }


# ---------- ENTITIES ----------
@app.get("/api/entities", response_model=List[schemas.EntityOut])
def list_entities(entity_type: Optional[str] = None, case_id: Optional[int] = None,
                   db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    q = db.query(Entity)
    if entity_type:
        q = q.filter(Entity.entity_type == entity_type)
    if case_id is not None:
        case_entity_ids = {
            row[0] for row in db.query(EntityMention.entity_id).filter(EntityMention.case_id == case_id).distinct()
        }
        q = q.filter(Entity.id.in_(case_entity_ids)) if case_entity_ids else q.filter(False)
    return q.order_by(Entity.mention_count.desc()).all()


@app.get("/api/entities/{entity_id}")
def entity_detail(entity_id: int, db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    entity = db.query(Entity).get(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    mentions = db.query(EntityMention).filter(EntityMention.entity_id == entity_id).all()
    case_ids = list({m.case_id for m in mentions})
    cases = db.query(Case).filter(Case.id.in_(case_ids)).all()

    rels = db.query(Relationship).filter(
        or_(Relationship.entity_a_id == entity_id, Relationship.entity_b_id == entity_id)
    ).all()
    connections = []
    for r in rels:
        other_id = r.entity_b_id if r.entity_a_id == entity_id else r.entity_a_id
        other = db.query(Entity).get(other_id)
        connections.append({"entity_id": other.id, "name": other.name, "type": other.entity_type,
                             "strength": r.strength_score})

    return {
        "id": entity.id, "name": entity.name, "entity_type": entity.entity_type,
        "mention_count": entity.mention_count,
        "cases": [{"id": c.id, "case_number": c.case_number, "title": c.title} for c in cases],
        "connections": connections,
        "context_snippets": [m.context_snippet for m in mentions[:10]],
    }


# ---------- SEARCH ----------
@app.get("/api/search")
def search(q: str, db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    if not q or len(q.strip()) < 2:
        return {"entities": [], "cases": []}
    like = f"%{q.strip()}%"
    entities = db.query(Entity).filter(Entity.name.ilike(like)).limit(20).all()
    cases = db.query(Case).filter(or_(Case.title.ilike(like), Case.case_number.ilike(like))).limit(20).all()
    return {
        "entities": [{"id": e.id, "name": e.name, "type": e.entity_type, "mentions": e.mention_count} for e in entities],
        "cases": [{"id": c.id, "case_number": c.case_number, "title": c.title} for c in cases],
    }


# ---------- NETWORK GRAPH ----------
@app.get("/api/graph", response_model=schemas.GraphResponse)
def get_graph(case_id: Optional[int] = None, entity_type: Optional[str] = None,
              db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    if case_id:
        entity_ids = {m.entity_id for m in db.query(EntityMention).filter(EntityMention.case_id == case_id).all()}
        rel_q = db.query(Relationship).filter(
            Relationship.entity_a_id.in_(entity_ids) if entity_ids else False
        )
        rels = [r for r in rel_q.all() if r.entity_a_id in entity_ids and r.entity_b_id in entity_ids]
    else:
        entity_ids = None
        rels = db.query(Relationship).all()

    node_ids = set()
    for r in rels:
        node_ids.add(r.entity_a_id)
        node_ids.add(r.entity_b_id)
    if entity_ids is not None:
        node_ids = entity_ids

    entities = db.query(Entity).filter(Entity.id.in_(node_ids)).all() if node_ids else []
    if entity_type:
        entities = [e for e in entities if e.entity_type == entity_type]
        filtered_ids = {e.id for e in entities}
        rels = [r for r in rels if r.entity_a_id in filtered_ids and r.entity_b_id in filtered_ids]

    nodes = [schemas.GraphNode(id=e.id, label=e.name, type=e.entity_type, mention_count=e.mention_count)
             for e in entities]
    edges = [schemas.GraphEdge(source=r.entity_a_id, target=r.entity_b_id,
                                strength=r.strength_score, case_ids=r.case_ids or [])
             for r in rels]
    return schemas.GraphResponse(nodes=nodes, edges=edges)


# ---------- INSIGHTS ----------
@app.get("/api/insights", response_model=List[schemas.InsightOut])
def list_insights(case_id: Optional[int] = None, db: Session = Depends(get_db),
                   _user: str = Depends(auth.verify_token)):
    insights = db.query(Insight).order_by(Insight.severity.desc(), Insight.id.desc()).all()
    if case_id is not None:
        insights = [i for i in insights if case_id in (i.related_case_ids or [])]
    return insights


@app.patch("/api/insights/{insight_id}/review")
def mark_reviewed(insight_id: int, db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    insight = db.query(Insight).get(insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    insight.reviewed = not insight.reviewed
    db.commit()
    return {"id": insight.id, "reviewed": insight.reviewed}


# ---------- DASHBOARD STATS ----------
@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), _user: str = Depends(auth.verify_token)):
    return {
        "total_cases": db.query(Case).count(),
        "total_entities": db.query(Entity).count(),
        "total_relationships": db.query(Relationship).count(),
        "total_insights": db.query(Insight).count(),
        "unreviewed_insights": db.query(Insight).filter(Insight.reviewed == False).count(),
        "recent_insights": [
            {"id": i.id, "type": i.type, "description": i.description, "severity": i.severity}
            for i in db.query(Insight).order_by(Insight.id.desc()).limit(5).all()
        ],
    }


@app.get("/")
def root():
    return {"status": "ok", "service": "SIH26189 Criminal Network Analysis API"}
