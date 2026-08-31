"""
Relationship + insight generation.
Rule-based and explainable by design (not a black-box ML claim):
- Two entities co-occurring in the same report -> relationship edge
- An entity appearing across >=2 different cases -> "repeated entity" insight
- Two cases sharing >=2 entities -> "possible linked cases" insight
- A node with high degree (many connections) -> "central figure" insight
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import Entity, EntityMention, Relationship, Insight
from itertools import combinations


def rebuild_relationships_for_report(db: Session, report_id: int, case_id: int):
    mentions = db.query(EntityMention).filter(EntityMention.report_id == report_id).all()
    entity_ids = list({m.entity_id for m in mentions})

    for a_id, b_id in combinations(sorted(entity_ids), 2):
        rel = db.query(Relationship).filter(
            ((Relationship.entity_a_id == a_id) & (Relationship.entity_b_id == b_id))
        ).first()
        if rel:
            case_ids = set(rel.case_ids or [])
            case_ids.add(case_id)
            rel.case_ids = list(case_ids)
            rel.strength_score = len(case_ids)
        else:
            rel = Relationship(
                entity_a_id=a_id,
                entity_b_id=b_id,
                relationship_type="CO_OCCURRENCE",
                case_ids=[case_id],
                strength_score=1,
            )
            db.add(rel)
    db.commit()


def generate_insights(db: Session):
    """Recompute insights from current state. Simple + explainable rules."""
    db.query(Insight).delete()

    # 1. Repeated entities across multiple cases
    mention_case_counts = (
        db.query(EntityMention.entity_id, func.count(func.distinct(EntityMention.case_id)))
        .group_by(EntityMention.entity_id)
        .all()
    )
    for entity_id, case_count in mention_case_counts:
        if case_count >= 2:
            entity = db.query(Entity).get(entity_id)
            case_ids = [
                c for (c,) in db.query(EntityMention.case_id)
                .filter(EntityMention.entity_id == entity_id).distinct()
            ]
            severity = "high" if case_count >= 3 else "medium"
            db.add(Insight(
                type="REPEATED_ENTITY",
                description=f"'{entity.name}' ({entity.entity_type}) appears in {case_count} separate cases.",
                related_entity_ids=[entity_id],
                related_case_ids=case_ids,
                severity=severity,
            ))

    # 2. Cases sharing >=2 entities -> possibly linked cases
    case_entities = {}
    for entity_id, case_id in db.query(EntityMention.entity_id, EntityMention.case_id).distinct():
        case_entities.setdefault(case_id, set()).add(entity_id)

    for (case_a, ents_a), (case_b, ents_b) in combinations(case_entities.items(), 2):
        shared = ents_a & ents_b
        if len(shared) >= 2:
            names = [db.query(Entity).get(eid).name for eid in list(shared)[:5]]
            db.add(Insight(
                type="CROSS_CASE_LINK",
                description=f"Case #{case_a} and Case #{case_b} share {len(shared)} entities: {', '.join(names)}.",
                related_entity_ids=list(shared),
                related_case_ids=[case_a, case_b],
                severity="high" if len(shared) >= 3 else "medium",
            ))

    # 3. High-degree nodes (central figures) — only count connections that
    # span MULTIPLE cases (relationship.case_ids length >= 2). A within-one-report
    # co-occurrence clique would otherwise make every entity look "central",
    # which isn't a meaningful signal for an investigator.
    degree = {}
    for rel in db.query(Relationship).all():
        if len(rel.case_ids or []) >= 2:
            degree[rel.entity_a_id] = degree.get(rel.entity_a_id, 0) + 1
            degree[rel.entity_b_id] = degree.get(rel.entity_b_id, 0) + 1

    for entity_id, deg in degree.items():
        if deg >= 2:
            entity = db.query(Entity).get(entity_id)
            db.add(Insight(
                type="HIGH_DEGREE_NODE",
                description=f"'{entity.name}' has cross-case connections to {deg} other entities — a potential central figure worth review.",
                related_entity_ids=[entity_id],
                related_case_ids=[],
                severity="high" if deg >= 4 else "medium",
            ))

    db.commit()
