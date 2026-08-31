from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime

DATABASE_URL = "sqlite:///./crimenet.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String, default="")
    role = Column(String, default="investigator")


class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(Text, default="")
    status = Column(String, default="open")  # open, under_review, closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by = Column(String, default="")

    reports = relationship("Report", back_populates="case", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    filename = Column(String)
    raw_text = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="reports")


class Entity(Base):
    __tablename__ = "entities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    normalized_name = Column(String, index=True)
    entity_type = Column(String)  # PERSON, ORG, LOCATION, PHONE, ACCOUNT, VEHICLE, EMAIL
    mention_count = Column(Integer, default=0)


class EntityMention(Base):
    __tablename__ = "entity_mentions"
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    report_id = Column(Integer, ForeignKey("reports.id"))
    case_id = Column(Integer, ForeignKey("cases.id"))
    context_snippet = Column(Text, default="")


class Relationship(Base):
    __tablename__ = "relationships"
    id = Column(Integer, primary_key=True, index=True)
    entity_a_id = Column(Integer, ForeignKey("entities.id"))
    entity_b_id = Column(Integer, ForeignKey("entities.id"))
    relationship_type = Column(String, default="CO_OCCURRENCE")
    case_ids = Column(JSON, default=list)
    strength_score = Column(Integer, default=1)


class Insight(Base):
    __tablename__ = "insights"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # REPEATED_ENTITY, CROSS_CASE_LINK, HIGH_DEGREE_NODE
    description = Column(Text)
    related_entity_ids = Column(JSON, default=list)
    related_case_ids = Column(JSON, default=list)
    severity = Column(String, default="medium")  # low, medium, high
    reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
