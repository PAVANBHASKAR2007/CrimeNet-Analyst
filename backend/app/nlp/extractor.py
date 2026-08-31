"""
Entity extraction pipeline for case reports.
Combines spaCy NER (PERSON, ORG, GPE) with regex extraction for
structured entities (phone numbers, emails, account numbers, vehicle plates).
"""
import re
import spacy
from rapidfuzz import fuzz

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


REGEX_PATTERNS = {
    "PHONE": re.compile(r"(?:\+91[-\s]?)?[6-9]\d{9}\b"),
    "EMAIL": re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),
    "ACCOUNT": re.compile(r"\b(?:A/C|Account|Acc)\.?\s?(?:No\.?|Number)?\s?[:\-]?\s?(\d{9,18})\b", re.IGNORECASE),
    "VEHICLE": re.compile(r"\b[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,2}[\s-]?\d{4}\b"),
}

SPACY_TYPE_MAP = {
    "PERSON": "PERSON",
    "ORG": "ORG",
    "GPE": "LOCATION",
    "LOC": "LOCATION",
    "FAC": "LOCATION",
}

# Common spaCy false-positives on short police-report style text —
# filtered out to keep the demo graph clean and credible.
STOPLIST = {"rs", "cctv", "fir", "si", "a/c", "case report", "no", "date"}


def normalize(name: str) -> str:
    return " ".join(name.strip().split()).lower()


def extract_snippet(text: str, start: int, end: int, window: int = 60) -> str:
    s = max(0, start - window)
    e = min(len(text), end + window)
    prefix = "..." if s > 0 else ""
    suffix = "..." if e < len(text) else ""
    return f"{prefix}{text[s:e].strip()}{suffix}"


def extract_entities(text: str):
    """
    Returns a list of dicts: {name, entity_type, start, end, context}
    """
    results = []
    seen_spans = set()

    # spaCy NER pass
    doc = get_nlp()(text)
    for ent in doc.ents:
        mapped = SPACY_TYPE_MAP.get(ent.label_)
        if not mapped:
            continue
        if len(ent.text.strip()) < 2:
            continue
        if normalize(ent.text) in STOPLIST:
            continue
        results.append({
            "name": ent.text.strip(),
            "entity_type": mapped,
            "start": ent.start_char,
            "end": ent.end_char,
            "context": extract_snippet(text, ent.start_char, ent.end_char),
        })
        seen_spans.add((ent.start_char, ent.end_char))

    # Regex pass for structured entities
    for etype, pattern in REGEX_PATTERNS.items():
        for m in pattern.finditer(text):
            span = (m.start(), m.end())
            if span in seen_spans:
                continue
            value = m.group(1) if m.groups() else m.group(0)
            results.append({
                "name": value.strip(),
                "entity_type": etype,
                "start": m.start(),
                "end": m.end(),
                "context": extract_snippet(text, m.start(), m.end()),
            })

    return results


def resolve_duplicate(name: str, entity_type: str, existing_entities: list, threshold: int = 90):
    """
    Lightweight entity resolution: fuzzy-match against existing entities
    of the same type to avoid creating near-duplicate nodes
    (e.g. 'Ravi Kumar' vs 'ravi  kumar').
    Returns the matched existing entity dict, or None.
    """
    norm = normalize(name)
    for e in existing_entities:
        if e["entity_type"] != entity_type:
            continue
        if fuzz.ratio(norm, e["normalized_name"]) >= threshold:
            return e
    return None
